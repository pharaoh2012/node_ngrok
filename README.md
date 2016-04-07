使用nodejs实现ngrok的部分功能。
========
由于[ngrok](https://ngrok.com/)在国内不稳定，自己试着实现了ngrok的部分功能，可以通过域名访问内网的http访问。

## 安装部署
### 公网服务器端安装：
在[coding.net](https://coding.net/)上新建一个nodejs的演示，记录下演示的域名： aaa.coding.io

### 内网服务器安装
* 远程内网服务器
* 在服务器上安装[nodejs](https://nodejs.org/)
* 下载源代码到服务器某一个目录，解压。
* 在源代码目录下运行`npm install`安装依赖。
* 修改debug.bat文件中的`NODE_SERVER_HOST`为部署的演示域名
* 修改debug.bat文件中的`NODE_SERVER_PORT`为部署的端口，一般是80
* 修改debug.bat文件中的`NODE_PROXY_NAME`为客户端的名称，可以支持不同的内网服务器。
* 运行`debug.bat`,启动本地服务。（Linux下可参照bat文件修改）

## 使用
* 在浏览器中输入演示服务器的地址，例如 http://aaa.coding.io/。
* 在弹出的对话框中，用户名是`NODE_PROXY_NAME`的值，密码是内网服务器的端口，例如 80
* 确定后就可以通过 http://aaa.coding.io/ 访问内网的http服务了。


