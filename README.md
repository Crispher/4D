## 4D cube

渲染一个四维空间在三维视窗上的投影，可通过键盘操作四维空间中视窗（相机）的位置和方向。

基本操作：数字键小键盘：
 - 1/4: 将相机沿着三维视窗的X轴前后移动（不改变相机的朝向）
 - 2/5: Y轴；
 - 3/6: Z轴；

Ctrl +
 - 1/4: 将相机向X轴的负/正方向倾斜（不改变相机的位置）
 - 2/5: Y轴；
 - 3/6: Z轴。

三维视窗的边框将会出现相应的变化，以提示相机状态的改变。

It uses webpack-dev-server for the development build, and NodeJS with Express for production build.

Both server and client projects are written in TypeScript.


## Installing
0. 安装NodeJS和npm
https://nodejs.org/en/download/
https://docs.npmjs.com/downloading-and-installing-node-js-and-npm

1. Clone this Repository

2. CD into folder

```bash
cd 4D
git checkout master
```

3. Install TypeScript

```bash
npm install -g typescript
```

4. Install dependencies

```bash
npm install
```

5. Start it

```bash
npm run dev
```

6. Visit [http://127.0.0.1:8080](http://127.0.0.1:8080)


7. Edit project in VSCode
可以从src/client/client.ts开始阅读代码。
