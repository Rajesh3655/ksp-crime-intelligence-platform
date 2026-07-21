INSERT INTO State (StateID, StateName, NationalityID, Active) VALUES (29, 'Karnataka', 91, true);

INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (1, 'Bagalkote', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (2, 'Ballari', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (3, 'Belagavi', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (4, 'Bengaluru Rural', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (5, 'Bengaluru Urban', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (6, 'Bidar', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (7, 'Chamarajanagar', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (8, 'Chikkaballapura', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (9, 'Chikkamagaluru', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (10, 'Chitradurga', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (11, 'Dakshina Kannada', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (12, 'Davanagere', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (13, 'Dharwad', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (14, 'Gadag', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (15, 'Hassan', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (16, 'Haveri', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (17, 'Kalaburagi', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (18, 'Kodagu', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (19, 'Kolar', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (20, 'Koppal', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (21, 'Mandya', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (22, 'Mysuru', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (23, 'Raichur', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (24, 'Ramanagara', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (25, 'Shivamogga', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (26, 'Tumakuru', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (27, 'Udupi', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (28, 'Uttara Kannada', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (29, 'Vijayapura', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (30, 'Yadgir', 29, true);
INSERT INTO District (DistrictID, DistrictName, StateID, Active) VALUES (31, 'Vijayanagara', 29, true);

INSERT INTO UnitType (UnitTypeID, UnitTypeName, CityDistState, Hierarchy, Active) VALUES (1, 'State Police', 'State', 1, true);
INSERT INTO UnitType (UnitTypeID, UnitTypeName, CityDistState, Hierarchy, Active) VALUES (2, 'District Police', 'District', 2, true);
INSERT INTO UnitType (UnitTypeID, UnitTypeName, CityDistState, Hierarchy, Active) VALUES (3, 'Police Station', 'Station', 3, true);

INSERT INTO Unit (UnitID, UnitName, TypeID, ParentUnit, NationalityID, StateID, DistrictID, Active) VALUES (101, 'Bengaluru South PS', 3, null, 91, 29, 5, true);
INSERT INTO Unit (UnitID, UnitName, TypeID, ParentUnit, NationalityID, StateID, DistrictID, Active) VALUES (102, 'Mysuru Central PS', 3, null, 91, 29, 22, true);
INSERT INTO Unit (UnitID, UnitName, TypeID, ParentUnit, NationalityID, StateID, DistrictID, Active) VALUES (103, 'Kalaburagi Market PS', 3, null, 91, 29, 17, true);
INSERT INTO Unit (UnitID, UnitName, TypeID, ParentUnit, NationalityID, StateID, DistrictID, Active) VALUES (104, 'Hubballi Cyber PS', 3, null, 91, 29, 13, true);
INSERT INTO Unit (UnitID, UnitName, TypeID, ParentUnit, NationalityID, StateID, DistrictID, Active) VALUES (105, 'Mangaluru Coastal PS', 3, null, 91, 29, 11, true);

INSERT INTO Rank (RankID, RankName, Hierarchy, Active) VALUES (1, 'Inspector', 5, true);
INSERT INTO Rank (RankID, RankName, Hierarchy, Active) VALUES (2, 'Sub Inspector', 6, true);
INSERT INTO Rank (RankID, RankName, Hierarchy, Active) VALUES (3, 'Constable', 9, true);

INSERT INTO Designation (DesignationID, DesignationName, Active, SortOrder) VALUES (1, 'Investigating Officer', true, 1);
INSERT INTO Designation (DesignationID, DesignationName, Active, SortOrder) VALUES (2, 'Station House Officer', true, 2);

INSERT INTO Employee (EmployeeID, DistrictID, UnitID, RankID, DesignationID, KGID, FirstName, EmployeeDOB, GenderID, BloodGroupID, PhysicallyChallenged, AppointmentDate) VALUES (1001, 5, 101, 1, 1, 'KGID1001', 'Anitha R', '1985-05-14', 2, 1, false, '2010-06-01');
INSERT INTO Employee (EmployeeID, DistrictID, UnitID, RankID, DesignationID, KGID, FirstName, EmployeeDOB, GenderID, BloodGroupID, PhysicallyChallenged, AppointmentDate) VALUES (1002, 22, 102, 2, 1, 'KGID1002', 'Rajesh P', '1988-08-20', 1, 2, false, '2013-03-15');
INSERT INTO Employee (EmployeeID, DistrictID, UnitID, RankID, DesignationID, KGID, FirstName, EmployeeDOB, GenderID, BloodGroupID, PhysicallyChallenged, AppointmentDate) VALUES (1003, 17, 103, 1, 2, 'KGID1003', 'Kiran S', '1982-02-07', 1, 3, false, '2008-09-10');

INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (1, 'IPC');
INSERT INTO CaseCategory (CaseCategoryID, LookupValue) VALUES (2, 'Special Act');

INSERT INTO GravityOffence (GravityOffenceID, LookupValue) VALUES (1, 'Grave');
INSERT INTO GravityOffence (GravityOffenceID, LookupValue) VALUES (2, 'Non-Grave');

INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (1, 'Open');
INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (2, 'Investigation');
INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (3, 'Chargesheet Filed');
INSERT INTO CaseStatusMaster (CaseStatusID, CaseStatusName) VALUES (4, 'Closed');

INSERT INTO Court (CourtID, CourtName, DistrictID, StateID, Active) VALUES (501, 'Bengaluru City Civil Court', 5, 29, true);
INSERT INTO Court (CourtID, CourtName, DistrictID, StateID, Active) VALUES (502, 'Mysuru District Court', 22, 29, true);
INSERT INTO Court (CourtID, CourtName, DistrictID, StateID, Active) VALUES (503, 'Kalaburagi District Court', 17, 29, true);

INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (1, 'Property Crime', true);
INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (2, 'Cybercrime', true);
INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (3, 'Financial Fraud', true);
INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (4, 'Narcotics', true);
INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (5, 'Crimes Against Women', true);
INSERT INTO CrimeHead (CrimeHeadID, CrimeGroupName, Active) VALUES (6, 'Crimes Against Body', true);

INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (1, 1, 'Burglary', 1);
INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (2, 1, 'Vehicle Theft', 2);
INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (3, 1, 'Chain Snatching', 3);
INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (4, 2, 'UPI Fraud', 4);
INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (5, 2, 'Investment Scam', 5);
INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (6, 3, 'Loan App Fraud', 6);
INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (7, 4, 'Drug Distribution', 7);
INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (8, 5, 'Harassment', 8);
INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (9, 6, 'Assault', 9);
INSERT INTO CrimeSubHead (CrimeSubHeadID, CrimeHeadID, CrimeHeadName, SeqID) VALUES (10, 6, 'Robbery', 10);

INSERT INTO OccupationMaster (OccupationID, OccupationName) VALUES (1, 'Business');
INSERT INTO OccupationMaster (OccupationID, OccupationName) VALUES (2, 'Student');
INSERT INTO OccupationMaster (OccupationID, OccupationName) VALUES (3, 'Government Employee');

INSERT INTO ReligionMaster (ReligionID, ReligionName) VALUES (1, 'Hindu');
INSERT INTO ReligionMaster (ReligionID, ReligionName) VALUES (2, 'Muslim');
INSERT INTO ReligionMaster (ReligionID, ReligionName) VALUES (3, 'Christian');

INSERT INTO CasteMaster (caste_master_id, caste_master_name) VALUES (1, 'General');
INSERT INTO CasteMaster (caste_master_id, caste_master_name) VALUES (2, 'OBC');
INSERT INTO CasteMaster (caste_master_id, caste_master_name) VALUES (3, 'SC/ST');

INSERT INTO CaseMaster (CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID, CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID, IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts) VALUES (1, '1000510101202600001', '202600001', '2026-07-20', 1001, 101, 1, 1, 1, 1, 2, 501, '2026-07-20 21:40:00', '2026-07-20 22:10:00', '2026-07-20 22:18:00', 12.9352000, 77.6245000, 'Night burglary reported near Bengaluru South commercial corridor. Possible Ring Road Burglary Crew pattern. Vehicle KA-05-MQ-1401 seen.');
INSERT INTO CaseMaster (CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID, CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID, IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts) VALUES (2, '1002210202202600002', '202600002', '2026-07-19', 1002, 102, 1, 2, 2, 4, 2, 502, '2026-07-19 14:20:00', '2026-07-19 15:00:00', '2026-07-19 15:30:00', 12.3050000, 76.6550000, 'UPI fraud complaint from Mysuru. Similar phone and account pattern observed in previous cyber complaints.');
INSERT INTO CaseMaster (CaseMasterID, CrimeNo, CaseNo, CrimeRegisteredDate, PolicePersonID, PoliceStationID, CaseCategoryID, GravityOffenceID, CrimeMajorHeadID, CrimeMinorHeadID, CaseStatusID, CourtID, IncidentFromDate, IncidentToDate, InfoReceivedPSDate, latitude, longitude, BriefFacts) VALUES (3, '1001710303202600003', '202600003', '2026-07-18', 1003, 103, 2, 1, 4, 7, 1, 503, '2026-07-18 23:10:00', '2026-07-18 23:50:00', '2026-07-19 00:15:00', 17.3350000, 76.8420000, 'Narcotics distribution suspected near Kalaburagi Market. Possible NH-167 Network movement and repeat associate pattern.');

INSERT INTO ComplainantDetails (ComplainantID, CaseMasterID, ComplainantName, AgeYear, OccupationID, ReligionID, CasteID, GenderID) VALUES (1, 1, 'Ramesh Gowda', 46, 1, 1, 1, 1);
INSERT INTO ComplainantDetails (ComplainantID, CaseMasterID, ComplainantName, AgeYear, OccupationID, ReligionID, CasteID, GenderID) VALUES (2, 2, 'Meera N', 32, 3, 1, 2, 2);
INSERT INTO ComplainantDetails (ComplainantID, CaseMasterID, ComplainantName, AgeYear, OccupationID, ReligionID, CasteID, GenderID) VALUES (3, 3, 'Abdul Rahman', 41, 1, 2, 1, 1);

INSERT INTO Victim (VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID, VictimPolice) VALUES (1, 1, 'Ramesh Gowda', 46, 1, '0');
INSERT INTO Victim (VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID, VictimPolice) VALUES (2, 2, 'Meera N', 32, 2, '0');
INSERT INTO Victim (VictimMasterID, CaseMasterID, VictimName, AgeYear, GenderID, VictimPolice) VALUES (3, 3, 'Public Witness', 29, 1, '0');

INSERT INTO Accused (AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID, PersonID) VALUES (1, 1, 'Ravi Kumar A1', 31, 1, 'A1');
INSERT INTO Accused (AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID, PersonID) VALUES (2, 1, 'Manjunath S A2', 28, 1, 'A2');
INSERT INTO Accused (AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID, PersonID) VALUES (3, 2, 'Unknown Cyber Handler', 35, 1, 'A3');
INSERT INTO Accused (AccusedMasterID, CaseMasterID, AccusedName, AgeYear, GenderID, PersonID) VALUES (4, 3, 'Arjun Nayak A4', 34, 1, 'A4');

INSERT INTO ArrestSurrender (ArrestSurrenderID, CaseMasterID, ArrestSurrenderTypeID, ArrestSurrenderDate, ArrestSurrenderStateId, ArrestSurrenderDistrictId, PoliceStationID, IOID, CourtID, AccusedMasterID, IsAccused, IsComplainantAccused) VALUES (1, 1, 1, '2026-07-21', 29, 5, 101, 1001, 501, 1, true, false);
INSERT INTO ArrestSurrender (ArrestSurrenderID, CaseMasterID, ArrestSurrenderTypeID, ArrestSurrenderDate, ArrestSurrenderStateId, ArrestSurrenderDistrictId, PoliceStationID, IOID, CourtID, AccusedMasterID, IsAccused, IsComplainantAccused) VALUES (2, 3, 1, '2026-07-20', 29, 17, 103, 1003, 503, 4, true, false);

INSERT INTO ChargesheetDetails (CSID, CaseMasterID, csdate, cstype, PolicePersonID) VALUES (1, 1, '2026-08-10 10:00:00', 'A', 1001);

INSERT INTO IntelligenceRun (RunID, RunType, StartedAt, CompletedAt, Status, TotalCases, ModelVersion, TriggeredBy) VALUES (1, 'demo_seed', '2026-07-21 02:00:00', '2026-07-21 02:03:00', 'completed', 3, 'ciap-xgb-2026.07', 'manual');
INSERT INTO IntelligenceFinding (FindingID, RunID, CaseMasterID, DistrictID, FindingType, Severity, ConfidencePct, Summary, Explanation, SupportingCases, RecommendedAction) VALUES (1, 1, 1, 5, 'hotspot', 'red', 94, 'High risk burglary hotspot in Bengaluru South corridor', '34 percent theft increase, repeat offenders nearby, festival season, similar prior pattern', '1', 'Deploy 3 additional patrol units and one mobile checkpoint');
INSERT INTO IntelligenceFinding (FindingID, RunID, CaseMasterID, DistrictID, FindingType, Severity, ConfidencePct, Summary, Explanation, SupportingCases, RecommendedAction) VALUES (2, 1, 2, 22, 'cyber_network', 'orange', 88, 'UPI fraud pattern resembles cyber association cluster', 'Shared phone/account pattern and similar FIR descriptions', '2', 'Escalate to cyber cell and run account-link review');
INSERT INTO IntelligenceFinding (FindingID, RunID, CaseMasterID, DistrictID, FindingType, Severity, ConfidencePct, Summary, Explanation, SupportingCases, RecommendedAction) VALUES (3, 1, 3, 17, 'gang_probability', 'red', 91, 'Narcotics movement linked to NH-167 Network', 'Same corridor, late-night timing, repeat associate signal', '3', 'Coordinate highway patrol and narcotics unit surveillance');

INSERT INTO MLModelRegistry (ModelRegistryID, ModelID, Version, TrainingDate, Algorithm, TargetName, Status, Accuracy, PrecisionScore, RecallScore, F1Score, FeatureCount, StratusObjectKey, BuiltBy) VALUES (1, 'ciap-crime-prediction', 'ciap-xgb-2026.07', '2026-07-21 02:00:00', 'XGBoost', 'weekly_hotspot_prediction', 'ready', 87.00, 84.00, 82.00, 83.00, 24, 'models/ciap-xgb-2026.07.json', 'demo');

SELECT * FROM State;
SELECT * FROM District;
SELECT * FROM Unit;
SELECT * FROM CaseMaster;
SELECT * FROM IntelligenceFinding;
