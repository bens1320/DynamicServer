const fs = require("fs")


//读数据库
const usersString = fs.readFileSync("./db/users.json").toString()
const usersArr = JSON.parse(usersString)

//写数据库
const user3 = {id:2, name:"tom", password: "yyy"}
usersArr.push(user3)
const string = JSON.stringify(usersArr)
fs.writeFileSync("./db/users.json", string)