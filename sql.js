const READ_LAST_N_DAYS_RECORDS = "SELECT * FROM Expenses WHERE strftime('%Y-%m-%d',datetime(substr(Date, 7, 4) || '-' || substr(Date, 4, 2) || '-' || substr(Date, 1, 2))) > (SELECT DATETIME('now', ?))"
// for line chart?
const READ_GROUP_BY_DAY_SUM_COST = "SELECT Date, SUM(Amount) as Total, strftime('%m/%Y',datetime(substr(Date, 7, 4) || '-' || substr(Date, 4, 2) || '-' || substr(Date, 1, 2))) AS Month FROM Expenses WHERE Category IS NOT 'Auto' GROUP BY Date ORDER BY Month"
const READ_CURRENT_MONTH_RECORDS = "SELECT * FROM Expenses WHERE strftime('%m/%Y', strftime('%Y-%m-%d',datetime(substr(Date, 7, 4) || '-' || substr(Date, 4, 2) || '-' || substr(Date, 1, 2)))) IS ?"
const READ_CURRENT_MONTH_TARGET = "SELECT * FROM Targets WHERE Date LIKE ?"

const INSERT_NEW_RECORD = "INSERT INTO Expenses (Amount, Description, Category, Date) VALUES(?,?,?,?)"
const INSERT_NEW_TARGET = "INSERT INTO Targets (Date, Target) VALUES(?, ?);"

module.exports = {
    READ_LAST_N_DAYS_RECORDS,
    READ_GROUP_BY_DAY_SUM_COST,
    READ_CURRENT_MONTH_RECORDS,
    READ_CURRENT_MONTH_TARGET,
    INSERT_NEW_RECORD,
    INSERT_NEW_TARGET
}
