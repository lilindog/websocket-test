/*
* 解析数据帧的函数
* 根据帧头获取数据大小，解析完一帧后再返回，多帧数据需要在外部组合
* @param buf <Buffer> data事件的chunk
* @return <Object> 例如{FIN:1,len:127,size: 1000, data:""}
*
* 最后修改于 2019/4/1 凌晨0:04 （暂时完美）
*/


/*
* 用于保存chunk数据的buffer
*/
let totalBuf = Buffer.from([]);

/*
* 解析函数
*/
module.exports = function(chunk){
	let 
	index = 0,
	frame = {
		FIN: null,
		opcode: null,
		mask: null,
		len: 125,
		size: null,
		data: ""
	};
	//累加chunk
	addBuf(chunk);
	//检查最低字节数量（第一字节和第二字节）
	if(totalBuf.length < 2){
		index = 0;
		return false;
	}
	//解析FIN
	frame.FIN = totalBuf[index] >> 7;
	
	//解析opcode
	frame.opcode = totalBuf[index] & parseInt(00001111,2);
	
	//解析mask
	frame.mask = totalBuf[++index] >> 7;
	
	//解析len
	frame.len = totalBuf[index] & parseInt(1111111, 2);
	frame.size = frame.len;
	
	//获取超出125的长度
	if(frame.len === 126){
		if(totalBuf.length < index + 1 + 2) return false;
		frame.size = (totalBuf[++index] << 8) + totalBuf[++index];
	}
	if(frame.len === 127){
		if(totalBuf.length < index + 1 + 8) return false;
		index += 4;//前4个零暂不理会
		frame.size = (totalBuf[++index]<<24) + (totalBuf[++index]<<16) + (totalBuf[++index]<<8) + totalBuf[++index];
	}
	
	//获取mask
	if(frame.mask){
		if(totalBuf.length < index + 1 + 4) return false;
		frame.mask = [
			totalBuf[++index],
			totalBuf[++index],
			totalBuf[++index],
			totalBuf[++index]
		];
	}

	//检查数据载荷长度
	if(totalBuf.length < (index + 1 + frame.size) ) return false;

	//解析数据
	if(frame.mask){
		//buffer.slice()方法，第一个参数为起始索引，第二个参数为结束截止索引（不含）默认为buf.length
		let playLoad = totalBuf.slice(index + 1, index + frame.size + 1), arr = [], _ = null;
		console.log(playLoad)
		for(let i = 0; i < playLoad.length; i++){
			_ = playLoad[i] ^ frame.mask[i % 4];
			arr.push(_);
		}
		frame.data = Buffer.from(arr).toString();
	}else{
		let _ = totalBuf.slice(index + 1, index + frame.size + 1);
		frame.data = Buffer.from(_).toString();
	}

	totalBuf = totalBuf.slice(index + frame.size + 1);

	return frame;
}

/*
* 连接buffer的函数，将新buffer追加到旧buffer里边
* @parm newBuf <Buffer> 新的buffer
*/
function addBuf(newBuf){
	totalBuf = Buffer.concat([totalBuf, newBuf]);
}

