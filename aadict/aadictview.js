//
// aadictview.js
// Copyright (c) 2014 HASHIGAYA, Makoto
// This software is released under the MIT License, see LICENSE
// http://opensource.org/licenses/mit-license.php
//

dictdata = "";
function aadict_init(data_filename, menu_filename, menu_id, result_id)
{
	read_dict_data(data_filename);
	read_menu(menu_filename, menu_id, result_id);
}

function read_dict_data(filename, hook)
{
	var req = new XMLHttpRequest();
	req.open("GET", filename, true);
	req.onload = function() {
		dictdata = req.responseText.split((/\r\n|\r|\n/));
		if(hook) {
			hook();
		}
	}
	req.send();
}

function read_menu(filename, menu_id, result_id)
{
	var req = new XMLHttpRequest();
	req.open("GET", filename, true);
	req.onload = function() {
		var response = req.responseText.split((/\r\n|\r|\n/));
		var menu = "";
		menu = "<ul>";
		var group_opened = false;
		var group_name = "";
		for(var i in response) {
			var s = response[i];
			if(s=="") {
				continue;
			}
			if(s.substr(0,1)=="\t") {
				//menu item
				s = s.substr(1);
				menu += "<li class=\"clickable\" onclick=\"category_list('【分類】"+group_name+"/"+s+"', '"+result_id+"');\">"+s+"</li>";
			} else {
				// group
				if(group_opened) {
					menu += "</ul></li>";
				}
				menu += "<li>";
				menu += "<span class=\"expander\" onclick=\"expdexp(this.nextSibling.nextSibling, this);\">+</span>";
				menu += "<span class=\"clickable\" onclick=\"category_list('【分類】"+s+"', '"+result_id+"');\">"+s+"</span>";
				menu += "<ul style=\"display:none;\">";
				group_name = s;
				group_opened = true;
			}
		}
		menu += "</ul>";
		document.getElementById(menu_id).innerHTML = menu;
	}
	req.send();
}

function search(key, result_id)
{
	var result = simple_match(key)
	if(result.length==0) {
		document.getElementById(result_id).innerHTML = "<div>「" + key + "」は見つかりませんでした</div>"
		return;
	}
	document.getElementById(result_id).innerHTML = "<div>「" + key + "」の検索結果</div>" + basic_format(result);
		
}

function search_material(key, result_id)
{
	var result = match_by_material(key)
	if(result.length==0) {
		document.getElementById(result_id).innerHTML = "<div>「" + key + "」を材料にする製作物は見つかりませんでした</div>"
		return;
	}
	document.getElementById(result_id).innerHTML = "<div>「" + key + "」を材料にする製作物の検索結果</div>" + basic_format(result);

}

function search_item(key, result_id)
{
	if(search_item_func[key]) {
		search_item_func[key](key, result_id);
		return;
	}
	var result = match_by_item(key)
	if(result.length==0) {
		result =  match_by_hatvest(key)
		if(result.length==0) {
			document.getElementById(result_id).innerHTML = "<div>アイテム「" + key + "」は見つかりませんでした</div>"
			return;
		}
	}
	document.getElementById(result_id).innerHTML = "<div>アイテム「" + key + "」の検索結果</div>" + basic_format(result);

}

function simple_match(key)
{
	var result = new Array();
	for(i in dictdata) {
		s = dictdata[i];
		if(s.indexOf(key)>=0) {
			result.push(s);
		}
	}
	return result;
}

function regexp_match(re)
{
	var result = new Array();
	for(var i in dictdata) {
		s = dictdata[i];
		if(s.match(re)) {
			result.push(s);
		}
	}
	return result;
}
function match_by_material(key)
{
	var re = RegExp("(【材料】|【配置材料】|【建造材料】)[^【]*▽"+key+"x");
	return regexp_match(re);
}
function match_by_item(key)
{
	var re = RegExp("^"+key+"【");
	return regexp_match(re);
}
function match_by_hatvest(key)
{
	var re = RegExp("((獲得|収穫)物】"+key+"|(獲得|収穫)物】[^【]*▽"+key+")");
	return regexp_match(re);
}

function basic_format(result)
{
	var s = "";
	s += "<pre>"
	for(var i in result) {
		var r = result[i];
		r = textToCDATA(r)
		r = r.replace(/^[^【]+/, "<span class=\"clickable\" onclick=\"search_material('$&', 'result');\">$&</span>");
		r = replace_clickable(r, "【材料】", "search_item");
		r = replace_clickable(r, "【配置材料】", "search_item");
		r = replace_clickable(r, "【建造材料】", "search_item");
		r = replace_clickable(r, "獲得物】", "search_material");
		r = replace_clickable(r, "収穫物】", "search_material");
		r = r.replace(/【/g, "\n    【");
		r = r.replace(/▽/g, "\n        ▽");
		r = r + "\n \n";
		s += r;
	}
	s += "</pre>";
	return s;
}

function escape_regexp(s)
{
	s = s.replace(/[\.\*\[\]\^\$\+\*\(\)\|\{\}\\]/g, "\\$&");
	return s;
}

function category_list(key, result_id)
{
	var result = regexp_match(escape_regexp(key)+"(/|【|$)")
	document.getElementById(result_id).innerHTML = "<div>" + key + "</div>" + list_format(result);
}
function list_format(result)
{
	var s = "";
	for(var i in result) {
		var r = result[i];
		r = textToCDATA(r)
		r.match(/^[^【]+/);
		var item_name = RegExp.lastMatch;
		r = RegExp.rightContext;
		r = replace_clickable(r, "【材料】", "search_item");
		r = replace_clickable(r, "【配置材料】", "search_item");
		r = replace_clickable(r, "【建造材料】", "search_item");
		r = replace_clickable(r, "獲得物】", "search_material");
		r = replace_clickable(r, "収穫物】", "search_material");
		r = r.replace(/【/g, "\n    【");
		r = r.replace(/▽/g, "\n        ▽");
		r = r + "\n \n";
		s += "<div>";
		s += "<span class=\"expander\" onclick=\"expdexp(this.nextSibling.nextSibling, this);\">+</span>";
		s += "<span class=\"clickable\" onclick=\"search_material('" + item_name + "', 'result');\">" + item_name + "</span>";
		s += "<pre style=\"display:none;\">";
		s += r;
		s += "</pre>";
		s += "</div>";
	}
	return s;
}

function replace_clickable(s, attr, search_func)
{
	var re = RegExp(attr+"([^【]*)");
	s.match(re);
	var m = RegExp.$1;
	if(m.indexOf("▽")==-1) {
		m = m.replace(/^(.*)x/, "】<span class=\"clickable\" onclick=\""+search_func+"l('$1', 'result');\">$1</span>x");
	} else {
		m = m.replace(/▽([^<x]+)x/g, "▽<span class=\"clickable\" onclick=\""+search_func+"('$1', 'result');\">$1</span>x");
	}
	s = s.replace(re, attr+m);
	return s;
}


function search_universal_material(key, result_id)
{
	var result = match_by_item(key)
	if(result.length==0) {
		document.getElementById(result_id).innerHTML = "<div>アイテム「" + key + "」は見つかりませんでした</div>"
		return;
	}
	document.getElementById(result_id).innerHTML = universal_material_format(key, result) + basic_format(result);
}
function universal_material_format(item, result)
{
	var s = "";
	s += "<table>";
	s += "<caption class=\"clickable\" onclick=\"search_material('" + textToCDATA(item) + "', 'result');\">" + textToCDATA(item) + "</caption>";
	s += "<tr><th>素材</th><th>" + textToCDATA(item) + "</th></tr>";
	for(var i in result) {
		var r = result[i];
		if(r.match(/【獲得数】([0-9]+)/)) {
			var number = textToCDATA(RegExp.$1);
		} else {
			number = 1;
		}
		r.match(/【材料】([^【]*)/);
		var material = textToCDATA(RegExp.$1);
		material = material.replace(/▽練磨剤:祝福の彫刻刀x1/ ,"");
		material = material.replace(/▽([^<x]+)x.*/, "<span class=\"clickable\" onclick=\"search_item('$1', 'result');\">$1</span>");
		s += "<tr><td>" + material + "</td><td>" + number + "</td></tr>";
	}
	s += "</table>";
	return s;

}

search_item_func = {
	"破砕した穀物" : search_universal_material,
	"乾かした花草" : search_universal_material,
	"切れた野菜" : search_universal_material,
	"破砕した香辛料" : search_universal_material,
	"いぶした薬剤" : search_universal_material,
	"濃縮された果汁" : search_universal_material,
	"手入れした肉" : search_universal_material
};

function textToCDATA(s)
{
	s = s.replace(/&/g, "&amp;");
	s = s.replace(/</g, "&lt;");
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/"/g, "&quot;");
	return s;
}

function expdexp(t, m)
{
	if(t.style.display=="none") {
		t.style.display = "";
		m.innerHTML = "-";
	} else {
		t.style.display = "none";
		m.innerHTML = "+";
	}
}

