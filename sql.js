const READ_LAST_N_DAYS_RECORDS = "SELECT * FROM Expenses WHERE strftime('%Y-%m-%d',datetime(substr(Date, 7, 4) || '-' || substr(Date, 4, 2) || '-' || substr(Date, 1, 2))) > (SELECT DATETIME('now', ?))"
const READ_GROUP_BY_DAY_SUM_COST = "SELECT * FROM (SELECT Date, SUM(Amount) as Total, strftime('%m/%Y',datetime(substr(Date, 7, 4) || '-' || substr(Date, 4, 2) || '-' || substr(Date, 1, 2))) AS Month FROM Expenses WHERE Category IS NOT 'Auto' GROUP BY Date ORDER BY Month) e LEFT JOIN Targets t ON e.Month = t.Date"
const READ_CURRENT_MONTH_RECORDS = "SELECT * FROM Expenses WHERE strftime('%m/%Y', strftime('%Y-%m-%d',datetime(substr(Date, 7, 4) || '-' || substr(Date, 4, 2) || '-' || substr(Date, 1, 2)))) IS ?"
const READ_CURRENT_MONTH_TARGET = "SELECT * FROM Targets WHERE Date LIKE ?"
const READ_CATEGORIES = "SELECT * FROM Categories"

const INSERT_NEW_RECORD = "INSERT INTO Expenses (Amount, Description, Category, Date) VALUES(?,?,?,?)"
const INSERT_NEW_TARGET = "INSERT INTO Targets (Date, Target) VALUES(?, ?);"
const INSERT_AUTO_EXPENSES = "INSERT INTO Expenses (Amount, Description, Category, Date) VALUES (800,'房租','Auto',?), (25,'电话费','Auto',?), (1.28,'iCloud','Auto',?)"

module.exports = {
    READ_LAST_N_DAYS_RECORDS,
    READ_GROUP_BY_DAY_SUM_COST,
    READ_CURRENT_MONTH_RECORDS,
    READ_CURRENT_MONTH_TARGET,
    READ_CATEGORIES,
    INSERT_NEW_RECORD,
    INSERT_NEW_TARGET,
    INSERT_AUTO_EXPENSES
}
