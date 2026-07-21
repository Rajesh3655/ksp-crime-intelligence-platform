# Catalyst Manual Table Checklist

Use this file to create tables and columns in Catalyst Data Store UI. After these tables exist, paste queries from `database/catalyst-zcql-seed.sql` into ZCQL Console.

Do not create these Catalyst system columns manually: `ROWID`, `CREATORID`, `CREATEDTIME`, `MODIFIEDTIME`.

## Minimum Demo Tables

### State
- StateID: bigint/int
- StateName: varchar/text
- NationalityID: bigint/int
- Active: boolean

### District
- DistrictID: bigint/int
- DistrictName: varchar/text
- StateID: bigint/int
- Active: boolean

### UnitType
- UnitTypeID: bigint/int
- UnitTypeName: varchar/text
- CityDistState: varchar/text
- Hierarchy: bigint/int
- Active: boolean

### Unit
- UnitID: bigint/int
- UnitName: varchar/text
- TypeID: bigint/int
- ParentUnit: bigint/int
- NationalityID: bigint/int
- StateID: bigint/int
- DistrictID: bigint/int
- Active: boolean

### Rank
- RankID: bigint/int
- RankName: varchar/text
- Hierarchy: bigint/int
- Active: boolean

### Designation
- DesignationID: bigint/int
- DesignationName: varchar/text
- Active: boolean
- SortOrder: bigint/int

### Employee
- EmployeeID: bigint/int
- DistrictID: bigint/int
- UnitID: bigint/int
- RankID: bigint/int
- DesignationID: bigint/int
- KGID: varchar/text
- FirstName: varchar/text
- EmployeeDOB: date
- GenderID: bigint/int
- BloodGroupID: bigint/int
- PhysicallyChallenged: boolean
- AppointmentDate: date

### CaseCategory
- CaseCategoryID: bigint/int
- LookupValue: varchar/text

### GravityOffence
- GravityOffenceID: bigint/int
- LookupValue: varchar/text

### CaseStatusMaster
- CaseStatusID: bigint/int
- CaseStatusName: varchar/text

### Court
- CourtID: bigint/int
- CourtName: varchar/text
- DistrictID: bigint/int
- StateID: bigint/int
- Active: boolean

### CrimeHead
- CrimeHeadID: bigint/int
- CrimeGroupName: varchar/text
- Active: boolean

### CrimeSubHead
- CrimeSubHeadID: bigint/int
- CrimeHeadID: bigint/int
- CrimeHeadName: varchar/text
- SeqID: bigint/int

### OccupationMaster
- OccupationID: bigint/int
- OccupationName: varchar/text

### ReligionMaster
- ReligionID: bigint/int
- ReligionName: varchar/text

### CasteMaster
- caste_master_id: bigint/int
- caste_master_name: varchar/text

### CaseMaster
- CaseMasterID: bigint/int
- CrimeNo: varchar/text
- CaseNo: varchar/text
- CrimeRegisteredDate: date
- PolicePersonID: bigint/int
- PoliceStationID: bigint/int
- CaseCategoryID: bigint/int
- GravityOffenceID: bigint/int
- CrimeMajorHeadID: bigint/int
- CrimeMinorHeadID: bigint/int
- CaseStatusID: bigint/int
- CourtID: bigint/int
- IncidentFromDate: datetime
- IncidentToDate: datetime
- InfoReceivedPSDate: datetime
- latitude: decimal/double
- longitude: decimal/double
- BriefFacts: text

### ComplainantDetails
- ComplainantID: bigint/int
- CaseMasterID: bigint/int
- ComplainantName: varchar/text
- AgeYear: bigint/int
- OccupationID: bigint/int
- ReligionID: bigint/int
- CasteID: bigint/int
- GenderID: bigint/int

### Victim
- VictimMasterID: bigint/int
- CaseMasterID: bigint/int
- VictimName: varchar/text
- AgeYear: bigint/int
- GenderID: bigint/int
- VictimPolice: varchar/text

### Accused
- AccusedMasterID: bigint/int
- CaseMasterID: bigint/int
- AccusedName: varchar/text
- AgeYear: bigint/int
- GenderID: bigint/int
- PersonID: varchar/text

### ArrestSurrender
- ArrestSurrenderID: bigint/int
- CaseMasterID: bigint/int
- ArrestSurrenderTypeID: bigint/int
- ArrestSurrenderDate: date
- ArrestSurrenderStateId: bigint/int
- ArrestSurrenderDistrictId: bigint/int
- PoliceStationID: bigint/int
- IOID: bigint/int
- CourtID: bigint/int
- AccusedMasterID: bigint/int
- IsAccused: boolean
- IsComplainantAccused: boolean

### ChargesheetDetails
- CSID: bigint/int
- CaseMasterID: bigint/int
- csdate: datetime
- cstype: varchar/text
- PolicePersonID: bigint/int

### IntelligenceRun
- RunID: bigint/int
- RunType: varchar/text
- StartedAt: datetime
- CompletedAt: datetime
- Status: varchar/text
- TotalCases: bigint/int
- ModelVersion: varchar/text
- TriggeredBy: varchar/text

### IntelligenceFinding
- FindingID: bigint/int
- RunID: bigint/int
- CaseMasterID: bigint/int
- DistrictID: bigint/int
- FindingType: varchar/text
- Severity: varchar/text
- ConfidencePct: decimal/double
- Summary: text
- Explanation: text
- SupportingCases: text
- RecommendedAction: text

### MLModelRegistry
- ModelRegistryID: bigint/int
- ModelID: varchar/text
- Version: varchar/text
- TrainingDate: datetime
- Algorithm: varchar/text
- TargetName: varchar/text
- Status: varchar/text
- Accuracy: decimal/double
- PrecisionScore: decimal/double
- RecallScore: decimal/double
- F1Score: decimal/double
- FeatureCount: bigint/int
- StratusObjectKey: varchar/text
- BuiltBy: varchar/text
