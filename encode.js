/*
*
* 构造数据帧
* @param frame <Object> //帧对象，{FIN: 1, opcode: 1, data: ""}
* @return <Buffer>
*
*/

module.exports = function(frame){
	//存放字节
	let arr = [];
	
	//计算len
	let buf = Buffer.from(frame.data), size = buf.length, len = 0;
	if(size > 65535){
		len = 127;
	}else if(size > 125){
		len = 126;
	}else{
		len = size;
	}
	
	//处理FIN
	arr[0] = frame.FIN << 7;
	
	//处理opcode
	arr[0] += (frame.opcode & parseInt("00001111", 2) );
	
	//处理mask
	arr[1] = frame.mask << 7;
	
	//处理len
	arr[1] += len;
	
	//处理len大于125的表示字节
	if(len === 126){
		arr[2] = size >> 8;
		arr[3] = size;
	}
	if(len === 127){
		arr[2] = 0;
		arr[3] = 0;
		arr[4] = 0;
		arr[5] = 0;
		arr[6] = size >> 24;
		arr[7] = size >> 16;
		arr[8] = size >> 8;
		arr[9] = size;
	}
	
	//处理数据（这里作为服务器，就不用掩码加密了）
	return Buffer.concat([Buffer.from(arr), buf]);
	
}