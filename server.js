var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if (!port) {
  console.log('请指定端口号好不啦？\nnode server.js 8888 这样不会吗？')
  process.exit(1)
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url
  var queryString = ''
  if (pathWithQuery.indexOf('?') >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf('?'))
  }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method

  /******** 从这里开始看，上面不要看 ************/
  const session = JSON.parse(fs.readFileSync("./session.json").toString())

  console.log('有个傻子发请求过来啦！路径（带查询参数）为：' + pathWithQuery)
  if (path === "/home.html") {
    response.setHeader("Content-Type", "text/html; charset=UTF-8")
    const cookie = request.headers["cookie"]
    let sessionId
    try {
      sessionId = cookie
        .split(";")
        .filter(e => e.indexOf("session_id=") >= 0)[0]
        .split("=")[1]
    } catch (error) {}

    console.log(sessionId)
    if (sessionId && session[sessionId]) {
      const userId = session[sessionId].user_id
      const usersArr = JSON.parse(fs.readFileSync("./db/users.json"));
      const user = usersArr.find(user => user.id === userId)
      const homeHTML = fs.readFileSync("./public/home.html").toString()
      let string = ""
      if (user) {
        string = homeHTML.replace("{{loginStatus}}", "已登录").replace("{{user.name}}", user.name)
        response.write(string)
      }

    } else {
      const homeHTML = fs.readFileSync("./public/home.html").toString()
      const string = homeHTML.replace("{{loginStatus}}", "未登录").replace("{{user.name}}", "游客身份")
      response.write(string)
    }
    response.end()

  } else if (path === "/login" && method === "POST") {
    response.setHeader("Content-Type", "text/html; charset=UTF-8")
    const arr = []
    const usersArr = JSON.parse(fs.readFileSync("./db/users.json"));
    request.on("data", (chunk) => {
      arr.push(chunk)
    })
    request.on("end", () => {
      //逐步解析
      const string = Buffer.concat(arr).toString();
      const obj = JSON.parse(string); // name password
      const user = usersArr.find(user => user.name === obj.name && user.password === obj.password)

      if (user === undefined) {
        response.statusCode = 400
        response.setHeader("Content-Type", "text/json;charset-UTF-8")
        response.end(`{"errorCode": 4001}`)
      } else {
        response.statusCode = 200
        const random = Math.random()
        session[random] = {
          user_id: user.id
        }
        fs.writeFileSync("./session.json", JSON.stringify(session))
        response.setHeader("Set-Cookie", `session_id=${random}; HttpOnly`)
        response.end()
      }

      response.end("收到")
    })

  } else if (path === "/register" && method === "POST") {
    response.setHeader("Content-Type", "text/html; charset=UTF-8")
    const arr = []
    const usersArr = JSON.parse(fs.readFileSync("./db/users.json"));

    const lastUser = usersArr[usersArr.length - 1]

    request.on("data", (chunk) => {
      arr.push(chunk)
    })
    request.on("end", () => {
      //逐步解析
      const string = Buffer.concat(arr).toString();
      const obj = JSON.parse(string); // name password
      const newUser = {
        id: lastUser ? lastUser.id + 1 : 1,
        name: obj.name,
        password: obj.password
      }
      usersArr.push(newUser)
      fs.writeFileSync("./db/users.json", JSON.stringify(usersArr))
      response.end("收到")
    })

  } else {
    //默认首页
    const filePath = path === "/" ? "/index.html" : path
    const index = filePath.lastIndexOf(".")

    //path的后缀, eg: .html
    const suffix = filePath.substring(index)

    const fileTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg'
    }

    response.statusCode = 200
    response.setHeader('Content-Type', `${fileTypes[suffix]|| 'text/html'};charset=utf-8`)

    let content
    try {
      content = fs.readFileSync(`./public${filePath}`)
    } catch (error) {
      content = "内容不存在!!!"
      response.statusCode = 404
    }
    response.write(content)
    response.end()
  }


  /******** 代码结束，下面不要看 ************/
})

server.listen(port)
console.log('监听 ' + port + ' 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:' + port)