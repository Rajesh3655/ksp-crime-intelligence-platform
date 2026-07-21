# Judge FAQ

## Is this based on the official FIR schema?

Yes. Core records use the attached ERD entities including `CaseMaster`, `Accused`, `Victim`, `ArrestSurrender`, `Court`, police unit/officer, and chargesheet tables. Intelligence outputs are stored separately in NoSQL and derived audit tables.

## Is the AI explainable?

Yes. Every prediction returns feature reasons, historical evidence, confidence, and recommended action.

## Is this only a dashboard?

No. The dashboard is the demonstration surface. The platform includes backend intelligence scoring, graph generation, ML lifecycle, drift checks, repeat-offender profiling, report generation, cron jobs, and Catalyst deployment mapping.

## Can it support live SCRB reporting?

Yes. SCRB briefing APIs and a SmartBrowz-ready report template are included.

## What is synthetic?

The demo dataset is synthetic for competition safety, but it follows the official table structure and realistic Karnataka district, station, seasonal, crime, repeat-offender, gang, and MO patterns.
