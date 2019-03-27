/*
* 解析数据帧的函数
* 根据帧头获取数据大小，解析完一帧后再返回，多帧数据需要在外部组合
* @param buf <Buffer> data事件的chunk
* @return <Object> 例如{FIN:1,len:127,size: 1000, data:""}
*/


/*
* 用于保存chunk数据的buffer
*/
let totalBuf = Buffer.from([]);

/*
* 用于记录字节处理index的变量
*/
let index = 0;

/*
* 初始化数据帧对象，解析完需要返回这个对象
*/
let frame = {
	FIN: null,
	opcode: null,
	mask: null,
	len: 125,
	size: null,
	data: ""
}

/*
* 解析函数
*/
module.exports = function(chunk){
	//累加chunk
	addBuf(chunk);
	//检查最低字节数量（第一字节和第二字节）
	if(totalBuf.length < 2){
		return false;
	}
	//解析FIN
	frame.FIN = totalBuf[index] >> 7;
	
	//解析opcode
	frame.opcode = totalBuf[index] & parseInt(00001111,2);
	
	//解析mask
	frame.mask = totalBuf[++index] >> 7;
	
	//解析len
	frame.mask = totalBuf[index] & parseInt(01111111, 2);
	
	//判断len,并获取数据载体长度
	if(frame.len <= 125){
		frame.size = frame.len;
	}
	if(frame.len === 126){
		//len等于126后面没有2个字节时，就退出
		if(totalBuf.size < (index + 1 + 2) ){
			return false;
		}
		frame.size = (totalBuf[++index]<<8) + totalBuf[++index];
	}
	if(fframe.len === 127){
		//len等于127，后面没有8个字节时，就退出
		if(totalBuf < (index + 1 + 8) ){
			return false;
		}
		frame.size = (totalBuf[++index]<<56) + (totalBuf[++index]<<48) + (totalBuf[++index]<<40) + (totalBuf[++index]<<32) + (totalBuf[++index]<<24) + (totalBuf[++index]<<16) + (totalBuf[++index]<<8) + totalBuf[++index];
	}
	
	//判断mask，并获取mask掩码
	if(frame.mask === 1){
		//如果需要掩码，后面没有4个字节的掩码时，就退出
		if(totalBuf.length < (index + 1 + 4)){
			return false;
		}
		frame.mask = [];
		frame.mask.push(totalBuf[++index], totalBuf[++index], totalBuf[++index], totalBuf[++index]);
	}
	
	//判断当前累积的totalBuf长度是否达到前面获取的数据载体长度，达到则解析，反之退出
	if(totalBuf.length < (index + 1 + frame.size) ){
		return false;
	}
	if(frame.mask){
		frame.data = [];
		for(let i = 0; i < frame.size; i++){
			frame.data.push(totalBuf[index+1+i] ^ frame.mask[i % 4]);
		}
		frame.data = Buffer.from(frame.data).toString();
	}else{
		frame.data = totalBuf.slice(index + 1, frame.size).toString();
	}
	
	//在total中删除已处理的字节
	totalBuf = totalBuf.slice(index + 1 + frame.size + 1);
}

/*
* 连接buffer的函数，将新buffer追加到旧buffer里边
* @parm newBuf <Buffer> 新的buffer
*/
function addBuf(newBuf){
	totalBuf = Buffer.concat([totalBuf, newBuf]);
}

