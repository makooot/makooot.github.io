//
// materials.js
// Copyright (c) 2014 HASHIGAYA, Makoto
// This software is released under the MIT License, see LICENSE
// http://opensource.org/licenses/mit-license.php
//

function material_view(data_file_name, arg, id)
{
	var root_item_name = get_query(arg, "q");
	var hook = (function(item, id) {
		return function(){
			material_tree(item, id);
		}
	})(root_item_name, id);
	read_dict_data(data_file_name, hook);
}

function material_tree(item_name, id)
{
	var material_tree = get_material_tree(item_name);

	if(material_tree.length==0) {
		document.getElementById(id).innerHTML = "「" + item_name + "」は見つかりませんでした";
	} else {
		var table_format= format_material_table(material_tree);
		var tree_format = format_material_tree(material_tree);
		document.getElementById(id).innerHTML = "「" + item_name + "」の材料ツリー</br>" + tree_format + table_format;
	}
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
		var number_of_acquired = parseInt(RegExp.$1)
	} else {
		var number_of_acquired = 1
	}
	if(typeof(number)!="number") {
		number = number_of_acquired
	}
	var times = Math.ceil(number / number_of_acquired);
	ary.push(number);

	if(in_exclude_list(item)) {
		return [item, number, [], []];
	}

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

Exclude_list = [
	"サンアーキウムの粉",
	"サンアーキウムの欠片",
	"サンアーキウムの結晶",
	"サンアーキウムの浄水",
	"ムーンアーキウムの粉",
	"ムーンアーキウムの欠片",
	"ムーンアーキウムの結晶",
	"ムーンアーキウムの浄水",
	"スターアーキウムの粉",
	"スターアーキウムの欠片",
	"スターアーキウムの結晶",
	"スターアーキウムの浄水",
	"破砕した穀物",
	"乾かした花草",
	"切れた野菜",
	"破砕した香辛料",
	"いぶした薬剤",
	"濃縮された果汁",
	"手入れした肉",
	"夜明けの湖添加剤",
	"輝く水埃",
	"神秘の月の粉",
	"神秘の月の欠片",
	"神秘の月の結晶",
	"神秘のムーンエッセンス"
];
function in_exclude_list(item)
{
	return Exclude_list.indexOf(item)!=-1;
}

function format_material_tree(tree)
{
	var name = tree.shift();
	var number = tree.shift();
	var cost = tree.shift();
	var sub_materials = tree.shift();
	var lines = [];
	lines = lines.concat([
		"<table>",
		"<tr><th>アイテム名</th><th>数量</th><th>コスト</th></tr>",
		"<tr><td>" + name + "</td><td>" + number + "</td><td>" + to_cost_string(cost) + "</td></tr>"
	]);
	lines = lines.concat(format_tree(sub_materials, ""));

	lines.push(	"</table>");

	return lines.join("");
}

function format_tree(tree, super_branch)
{
	var lines = [];
	while(tree.length>0) {
		var name = tree.shift();
		var number = tree.shift();
		var cost = tree.shift();
		var sub_materials = tree.shift();
		lines = lines.concat([
			"<tr><td>",
			super_branch,
			tree.length==0 ? "└" : "├",
			name, "</td><td>", number, "</td><td>", to_cost_string(cost), "</td></tr>"
		]);
		if(sub_materials.length>0) {
			lines = lines.concat(format_tree(sub_materials, super_branch+(tree.length==0 ? "　" : "│")));
		}
	}

	return　lines;
}

function format_material_table(tree)
{
	var material_table = sum_up_material(tree[3], new Object());
	var lines = [];
	lines.push(["<table><caption>材料別集計</caption><tr><th>アイテム名</th><th>数量</th></tr>"].join(""));
	for(var name in material_table) {
		var number = material_table[name][0];
		var has_material = material_table[name][1];
		if(!has_material) {
			continue;
		}
		lines.push(format_material(name, number, has_material));
	}
	for(var name in material_table) {
		var number = material_table[name][0];
		var has_material = material_table[name][1];
		if(has_material) {
			continue;
		}
		lines.push(format_material(name, number, has_material));
	}
	lines.push("</table>");
	return lines.join("");
}
function format_material(name, number, has_material)
{
	if(has_material) {
		name = "[" + name + "]";
	}
	return ["<tr><td>", name, "</td><td class=\"number\">", number, "</td></tr>"].join("")
}

function sum_up_material(original_tree, sum)
{
	var tree = original_tree.concat([]);
	while(tree.length>0) {
		var name = tree.shift();
		var number = tree.shift();
		var cost = tree.shift();
		var sub_tree = tree.shift();
		if(!sum || !sum[name]) {
			sum[name] = [ 0, false ];
		}
		sum[name][0] += number;
		if(sub_tree.length > 0) {
			sum[name][1] = true;
			sum = sum_up_material(sub_tree, sum);
		}
	}
	return sum;
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
