function material_view(data_file_name, arg, id)
{
	var root_item_name = get_query(arg, "q");
	var result_element = document.getElementById(id);

	var hook = (function(item_name, element) {
		return function(){
				var material_tree = get_material_tree(item_name, 1);
				
				if(material_tree.length==0) {
					element.innerHTML = "「" + item_name + "」は見つかりませんでした";
				} else {
					element.innerHTML = "「" + item_name + "」の材料ツリー</br>" + format_material_tree(material_tree);
				}
			};
		}) (root_item_name, result_element);

	read_dict_data(data_file_name, hook);
}

function get_query(query_string, key)
{
	var queries = query_string.substr(1).split(/&/);
	for(var i=0; i<queries.length; i++) {
		var key_value = queries[i].split(/=/);
		if(key_value[0]===key) {
			return decodeURI(key_value[1]);
		}
	}
}

function get_material_tree(item, number)
{
	var result = match_by_item(item);
	if(result.length==0) {
		return [];
	}
	var s = result[0];
	var ary = [];
	
	s.match(/^[^【]+/);
	ary.push(RegExp.lastMatch);
	
	if(s.match(/【獲得数】([0-9]+)/)) {
		var times = Math.ceil(number / parseInt(RegExp.$1));
	} else {
		times = number;
	}
	ary.push(number);	
	
	if(s.match(/【労働力】([0-9]+)/)) {
		ary.push(["stamina", parseInt(RegExp.$1) * times]);
	} else if(s.match(/【価格】([^【]+)/)) {
		var cost_string = RegExp.$1;
		if(cost_string.match(/デルフィナードの星x([0-9]+)/)) {
			ary.push(["star", parseInt(RegExp.$1)*times]);
		} else if(cost_string.match(/([0-9]+)名誉ポイント/)) {
			ary.push(["honor", parseInt(RegExp.$1)*times]);
		} else if(cost_string.match(/([0-9]+)生活ポイント/)) {
			ary.push(["live", parseInt(RegExp.$1)*times]);
		} else if(cost_string.match(/(([0-9]+)金)?(([0-9]+)銀)?(([0-9]+)銅)?/)) {
			var coin = 0;
			if(RegExp.$2) {
				coin += parseInt(RegExp.$2)*10000;
			}
			if(RegExp.$4) {
				coin += parseInt(RegExp.$4)*100;
			}
			if(RegExp.$6) {
				coin += parseInt(RegExp.$6);
			}
			ary.push(["coin", coin*times]);
		} else {
			ary.push(["unkwon", cost_string+"x"+times]);
		}
	} else {
		ary.push([]);
	}
	
	var material_array = [];
	if(s.match(/【材料】([^【]*)/)) {
		var s = RegExp.$1;
		if(s.substr(0,1)=="▽") {
			var materials = s.substr(1).split(/▽/);
		} else {
			materials = [ s ];
		}
		for(var mi=0; mi<materials.length; mi++) {
			var name_number = materials[mi].split(/x/);
			var sub_name  = name_number[0];
			var sub_number = parseInt(name_number[1]) * times;
			var sub_material_array = get_material_tree(sub_name, sub_number);
			if(sub_material_array.length==0) {
				material_array = material_array.concat([sub_name, sub_number, [], []]);
			} else {
				material_array = material_array.concat(sub_material_array);
			}
		}
	}
	ary.push(material_array);
	return ary;
}

function format_material_tree(tree)
{
	var lines = [];
	lines = lines.concat([
		"<table>",
		"<tr><th>アイテム名</th><th>数量</th><th>コスト</th></tr>"
	]);
	lines = lines.concat(format_tree(tree, 0));
	
	lines.push(	"</table>");
	
	return lines.join("");
}

function format_tree(tree, level)
{
	var lines = [];
	while(tree.length>0) {
		var name = tree.shift();
		var number = tree.shift();
		var cost = tree.shift();
		var sub_materials = tree.shift();
		lines = lines.concat([
			"<tr><td>",
			repeat_string("…", level),
			name, "</td><td>", number, "</td><td>", to_cost_string(cost), "</td></tr>"
		]);
		if(sub_materials.length>0) {
			lines = lines.concat(format_tree(sub_materials, level+1));
		}
	}
	
	return　lines;
}

function repeat_string(str, times)
{
	var s = "";
	while(times>0) {
		s += str;
		times--;
	}
	return s;
}

function to_cost_string(cost)
{
	switch(cost[0]) {
	case "stamina":
		return "労 "+cost[1];
	case "star":
		return "★"+cost[1];
	case "honor":
		return "名誉P "+cost[1];
	case "live":
		return "生活P "+cost[1];
	case "coin":
		var value = cost[1];
		var gold = Math.floor(value / 10000);
		var silver = Math.floor((value - gold * 10000) / 100);
		var copper = value - gold * 10000 - silver * 100;
		var s = "";
		if(gold > 0) {
			s += gold + "金";
		}
		if(silver > 0) {
			s += silver + "銀";
		}
		if(copper > 0) {
			s += copper + "銅";
		}
		return s;
	case "unkwon":
		return cost[1];
	}
	return "";
}
