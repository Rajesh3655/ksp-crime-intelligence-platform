/**
 * FIR Intelligence Routes
 * Read-only access over the official Police FIR ERD.
 */

'use strict';

const express = require('express');
const catalyst = require('catalyst-sdk');

const { asyncHandler, sendSuccess, paginate } = require('../middleware/errors');
const { requireDistrictScope } = require('../middleware/auth');

const router = express.Router();

const esc = value => String(value).replace(/'/g, "''");

router.get('/', requireDistrictScope, asyncHandler(async (req, res) => {
  const { page, perPage, offset } = paginate(req.query);
  const { districtId, stationId, crimeHeadId, crimeSubHeadId, statusId, search, dateFrom, dateTo } = req.query;

  const whereClauses = [];
  if (districtId) whereClauses.push(`d.DistrictID = ${parseInt(districtId, 10)}`);
  if (stationId) whereClauses.push(`cm.PoliceStationID = ${parseInt(stationId, 10)}`);
  if (crimeHeadId) whereClauses.push(`cm.CrimeMajorHeadID = ${parseInt(crimeHeadId, 10)}`);
  if (crimeSubHeadId) whereClauses.push(`cm.CrimeMinorHeadID = ${parseInt(crimeSubHeadId, 10)}`);
  if (statusId) whereClauses.push(`cm.CaseStatusID = ${parseInt(statusId, 10)}`);
  if (dateFrom) whereClauses.push(`cm.CrimeRegisteredDate >= '${esc(dateFrom)}'`);
  if (dateTo) whereClauses.push(`cm.CrimeRegisteredDate <= '${esc(dateTo)}'`);
  if (search) whereClauses.push(`MATCH(cm.BriefFacts) AGAINST('${esc(search)}' IN BOOLEAN MODE)`);

  if (req.user?.districtId) whereClauses.push(`d.DistrictID = ${parseInt(req.user.districtId, 10)}`);
  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const datastore = catalyst.datastore();
  const [countResult, dataResult] = await Promise.all([
    datastore.table('CaseMaster').query(`SELECT COUNT(*) AS total FROM CaseMaster cm LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID LEFT JOIN District d ON u.DistrictID = d.DistrictID ${where}`).catch(() => []),
    datastore.table('CaseMaster').query(
      `SELECT cm.*, d.DistrictName, u.UnitName, ch.CrimeGroupName, csh.CrimeHeadName, cs.CaseStatusName
       FROM CaseMaster cm
       LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
       LEFT JOIN District d ON u.DistrictID = d.DistrictID
       LEFT JOIN CrimeHead ch ON cm.CrimeMajorHeadID = ch.CrimeHeadID
       LEFT JOIN CrimeSubHead csh ON cm.CrimeMinorHeadID = csh.CrimeSubHeadID
       LEFT JOIN CaseStatusMaster cs ON cm.CaseStatusID = cs.CaseStatusID
       ${where}
       ORDER BY cm.CrimeRegisteredDate DESC
       LIMIT ${perPage} OFFSET ${offset}`
    ).catch(() => []),
  ]);

  const total = parseInt(countResult[0]?.total || countResult[0]?.['COUNT(*)'] || 0, 10);
  const cases = dataResult.map(row => ({
    caseMasterId: row.CaseMaster?.CaseMasterID,
    crimeNo: row.CaseMaster?.CrimeNo,
    caseNo: row.CaseMaster?.CaseNo,
    registeredDate: row.CaseMaster?.CrimeRegisteredDate,
    incidentFrom: row.CaseMaster?.IncidentFromDate,
    incidentTo: row.CaseMaster?.IncidentToDate,
    districtName: row.District?.DistrictName || row.DistrictName,
    unitName: row.Unit?.UnitName || row.UnitName,
    crimeMajorHead: row.CrimeHead?.CrimeGroupName || row.CrimeGroupName,
    crimeMinorHead: row.CrimeSubHead?.CrimeHeadName || row.CrimeHeadName,
    caseStatus: row.CaseStatusMaster?.CaseStatusName || row.CaseStatusName,
    latitude: row.CaseMaster?.latitude,
    longitude: row.CaseMaster?.longitude,
  }));

  sendSuccess(res, cases, { total, page, perPage, totalPages: Math.ceil(total / perPage) });
}));

router.get('/geo/heatmap', requireDistrictScope, asyncHandler(async (req, res) => {
  const { crimeHeadId, dateFrom, dateTo } = req.query;
  const whereClauses = ['cm.latitude IS NOT NULL', 'cm.longitude IS NOT NULL'];
  if (crimeHeadId) whereClauses.push(`cm.CrimeMajorHeadID = ${parseInt(crimeHeadId, 10)}`);
  if (dateFrom) whereClauses.push(`cm.CrimeRegisteredDate >= '${esc(dateFrom)}'`);
  if (dateTo) whereClauses.push(`cm.CrimeRegisteredDate <= '${esc(dateTo)}'`);
  if (req.user?.districtId) whereClauses.push(`d.DistrictID = ${parseInt(req.user.districtId, 10)}`);

  const datastore = catalyst.datastore();
  const result = await datastore.table('CaseMaster').query(
    `SELECT cm.latitude, cm.longitude, ch.CrimeGroupName, d.DistrictName, COUNT(*) AS point_count
     FROM CaseMaster cm
     LEFT JOIN Unit u ON cm.PoliceStationID = u.UnitID
     LEFT JOIN District d ON u.DistrictID = d.DistrictID
     LEFT JOIN CrimeHead ch ON cm.CrimeMajorHeadID = ch.CrimeHeadID
     WHERE ${whereClauses.join(' AND ')}
     GROUP BY cm.latitude, cm.longitude, ch.CrimeGroupName, d.DistrictName
     ORDER BY point_count DESC`
  ).catch(() => []);

  sendSuccess(res, result.map(row => ({
    lat: parseFloat(row.CaseMaster?.latitude || row.latitude),
    lng: parseFloat(row.CaseMaster?.longitude || row.longitude),
    count: parseInt(row.point_count || row['COUNT(*)'] || 0, 10),
    crimeHead: row.CrimeHead?.CrimeGroupName || row.CrimeGroupName,
    districtName: row.District?.DistrictName || row.DistrictName,
  })));
}));

router.get('/:id', requireDistrictScope, asyncHandler(async (req, res) => {
  const caseMasterId = parseInt(req.params.id, 10);
  const datastore = catalyst.datastore();

  const [caseRows, victims, accused, complainants, acts, arrests, chargesheets] = await Promise.all([
    datastore.table('CaseMaster').query(`SELECT * FROM CaseMaster WHERE CaseMasterID = ${caseMasterId} LIMIT 1`).catch(() => []),
    datastore.table('Victim').query(`SELECT * FROM Victim WHERE CaseMasterID = ${caseMasterId}`).catch(() => []),
    datastore.table('Accused').query(`SELECT * FROM Accused WHERE CaseMasterID = ${caseMasterId}`).catch(() => []),
    datastore.table('ComplainantDetails').query(`SELECT * FROM ComplainantDetails WHERE CaseMasterID = ${caseMasterId}`).catch(() => []),
    datastore.table('ActSectionAssociation').query(`SELECT * FROM ActSectionAssociation WHERE CaseMasterID = ${caseMasterId}`).catch(() => []),
    datastore.table('ArrestSurrender').query(`SELECT * FROM ArrestSurrender WHERE CaseMasterID = ${caseMasterId}`).catch(() => []),
    datastore.table('ChargesheetDetails').query(`SELECT * FROM ChargesheetDetails WHERE CaseMasterID = ${caseMasterId}`).catch(() => []),
  ]);

  if (!caseRows.length) return res.status(404).json({ success: false, error: 'CaseMaster record not found' });

  sendSuccess(res, {
    case: caseRows[0].CaseMaster || caseRows[0],
    victims: victims.map(row => row.Victim || row),
    accused: accused.map(row => row.Accused || row),
    complainants: complainants.map(row => row.ComplainantDetails || row),
    actSections: acts.map(row => row.ActSectionAssociation || row),
    arrests: arrests.map(row => row.ArrestSurrender || row),
    chargesheets: chargesheets.map(row => row.ChargesheetDetails || row),
  });
}));

module.exports = router;
