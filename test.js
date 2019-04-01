/*
* 测试encode与decode
*/

let fs = require("fs");
let decode = require("./decode");
let encode = require("./encode");

let data = fs.readFileSync("./data.text");

let buf = encode({
    FIN: 1,
    opcode: 2,
    data: data
});


let frame = decode(buf);
frame.data = "...";
console.log(frame);