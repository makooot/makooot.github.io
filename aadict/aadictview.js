//
// aadictview.js
// Copyright (c) 2014 HASHIGAYA, Makoto
// This software is released under the MIT License, see LICENSE
// http://opensource.org/licenses/mit-license.php
//

dictdata = "";
hist_id = "";
function aadict_init(args, data_filename, menu_filename, menu_id, result_id_, hist_id_)
{
	var search_word =  get_query(args, "q");
	var search_func = null;
	if(search_word) {
		search_func = (function(q) {
			return function() {
				search(q, result_id_);
			}
		})(search_word);
	}
	result_id = result_id_;
	hist_id = hist_id_;
	read_dict_data(data_filename, search_func);
	read_menu(menu_filename, menu_id, result_id_);
	hist_init(hist_id_);
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
		
		var menu_tree = [];
		for(var i in response) {
			var s = response[i];
			if(s=="") {
				continue;
			}
			if(s.substr(0, 1)=="\t") {
				menu_tree[menu_tree.length-1].push(s.substr(1));
			} else {
				menu_tree.push(s, []);
			}
		}
		
		var checkbox_id_number = 0;
		var menu = "<ul class=menu>";
		while(menu_tree.length > 0) {
			var group_name = menu_tree.shift();
			var sub_items = menu_tree.shift();
			var checkbox_id = "menu_checkbox_" + checkbox_id_number;
			
			menu += "<li>";
			menu += "<input type=checkbox class=menu_checkbox id=" + checkbox_id + " checked />";
			menu += "<label for=" + checkbox_id + " class=\"menu_checkbox_label expander\"></label>";
			menu += "<span class=clickable onclick=\"category_list('【分類】"+group_name+"', '"+result_id+"');\">"+group_name+"</span>";
			menu += "<ul class=sub_menu>";

			for(var i=0; i<sub_items.length; i++) {
				menu += "<li class=clickable onclick=\"category_list('【分類】"+group_name+"/"+sub_items[i]+"', '"+result_id+"');\">"+sub_items[i]+"</li>";
			}
			
			menu += "</ul></li>";
			checkbox_id_number++;
		}
		menu += "</ul>";
		document.getElementById(menu_id).innerHTML = menu;
	}
	req.send();
}

function search(raw_key, result_id)
{
	var search_kind;
	var key;
	if(raw_key.match(/^(tree:|item:|material:|harvest:)(.*)/)) {
		search_kind = RegExp.$1;
		key = RegExp.$2;
	} else{
		search_kind = "";
		key = raw_key;
	}
	var match_function;
	var target_string;
	var key_string = textToCDATA(key);
	switch(search_kind) {
	case "tree:":
		material_tree(key, result_id);
		record_hist(raw_key);
		return;
	case "item:":
		match_function = match_by_item_ex;
		target_string = "アイテム「" + key_string + "」";
		break;
	case "material:":
		match_function = match_by_material;
		target_string = "「" + key_string + "」を材料とする製作物";
		break;
	case "harvest:":
		match_function = match_by_hatvest;
		target_string = "収穫物「" + key_string + "」";
		break;
	default:
		match_function = simple_match;
		target_string = "「" + key_string + "」";
	}
	var result = match_function(key)
	if(result.length==0) {
		document.getElementById(result_id).innerHTML = "<div>" + target_string + "は見つかりませんでした</div>"
		return;
	}
	document.getElementById(result_id).innerHTML = "<div>" + target_string + "の検索結果</div>" + items_format(result, true);
	record_hist(raw_key);
}

function search_material(key, result_id)
{
	search("material:"+key, result_id);
	return;
}

function search_item(key, result_id)
{
	search("item:"+key, result_id);
	return;
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
	var re = RegExp("(【材料】|【配置材料】|【建造材料】)[^【]*▽"+escape_regexp(key)+"x");
	return regexp_match(re);
}
function match_by_item(key)
{
	var re = RegExp("^"+escape_regexp(key)+"【");
	return regexp_match(re);
}
function match_by_harvest(key)
{
	key = escape_regexp(key);
	var re = RegExp("((獲得|収穫)物】"+key+"|(獲得|収穫)物】[^【]*▽"+key+")");
	return regexp_match(re);
}

function match_by_item_ex(key)
{
	var result = match_by_item(key)
	if(result.length==0) {
		result =  match_by_harvest(key)
	}
	return result;

}

function items_format(result, expand)
{
	var s = "";
	if(expand) {
		var checked = " checked";
	} else {
		var checked = "";
	}

	for(var i in result) {
		var r = result[i];
		var has_material = r.match(/【材料】/);
		var checkbox_id = "item_detail_checkbox_id_"+i;
		r = textToCDATA(r)
		r.match(/^[^【]+/);
		var item_name = RegExp.lastMatch;
		r = RegExp.rightContext;
		r = replace_clickable(r, "【材料】", "search_item");
		r = replace_clickable(r, "【配置材料】", "search_item");
		r = replace_clickable(r, "【建造材料】", "search_item");
		r = replace_clickable(r, "【収穫時獲得物】", "search_material");
		r = replace_clickable(r, "【加工時獲得物】", "search_material");
		r = replace_clickable(r, "【伐採時獲得物】", "search_material");
		r = replace_clickable(r, "【採集時獲得物】", "search_material");
		r = replace_clickable(r, "【獲得物】", "search_material");
		r = replace_clickable(r, "【収穫物】", "search_material");
		r = r.replace(/【/g, "\n    【");
		r = r.replace(/▽/g, "\n        ▽");
		r = r + "\n \n";
		s += "<div>";
		s += item_name;
		s += " <input type=checkbox id=" + checkbox_id + " class=item_detail_checkbox" + checked + " />";
		s += "<label for=" + checkbox_id + " class=\"item_detail_label expander-triangle\"></label> ";
		if(has_material) {
			s += "<span class=tree_view_button onclick=\"search('tree:" + item_name + "', 'result')\"></span>";
		}
		s += " <span class=search_by_material_button onclick=\"search_material('" + item_name + "', 'result')\"></span>";
		s += "<pre class=item_detail_body>";
		s += r;
		s += "</pre>";
		s += "</div>";
	}
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
	document.getElementById(result_id).innerHTML = "<div>" + key + "</div>" + items_format(result, false);
}

function replace_clickable(s, attr, search_func)
{
	var re = RegExp(escape_regexp(attr)+"([^【]*)");
	s.match(re);
	var m = RegExp.$1;
	if(m.indexOf("▽")==-1) {
		m = m.replace(/^(.*)x/, "】<span class=\"clickable\" onclick=\""+search_func+"l('$1', 'result');\">$1</span>x");
	} else {
		m = m.replace(/▽([^x]+)x/g, "▽<span class=\"clickable\" onclick=\""+search_func+"('$1', 'result');\">$1</span>x");
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

search_history = (function() {
	var max_history = 20;
	return new function() {
		this.make_key = function(i)  {
			return "archeage-jp-hist-"+i;
		};
		this.get_cookie = function(key) {
			var re = RegExp(" "+key+"=([^;]+);");
			if(re.test(" "+document.cookie+";")) {
				return decodeURIComponent(RegExp.$1);
			} else {
				return "";
			}
		};
		this.set_cookie = function(key, value, expires) {
			if(arguments.length < 3) {
				expires = "; expires=Thu, 1-Jan-2030 00:00:00 GMT";
			} else if(expires!="") {
				expires = "; expires=" + expires;
			}
			document.cookie = key + "=" + encodeURIComponent(value) + expires;
		};

		this.get = function() {
			var histories = [];
			for(var i=0;i<max_history; i++) {
				var hist = this.get_cookie(this.make_key(i));
				if(hist!="") {
					histories.push(hist);
				}
			}
			return histories;
		};
		this.update = function(delete_item, add_item) {
			var histories = this.get();
			if(delete_item!="") {
				var i = histories.indexOf(delete_item);
				if(i!=-1) {
					histories.splice(i, 1);
				}
			}
			if(add_item!="") {
				histories.unshift(add_item);
			}
			for(var i=0;i<max_history; i++) {
				var item =  histories[i] || "";
				this.set_cookie(this.make_key(i), item);
			}
		};
		this.clear = function() {
			for(var i=0;i<max_history; i++) {
				this.set_cookie(this.make_key(i), "");
			}
		};
		this.record = function(s) {
			this.update(s, s);
		};
		this.del = function(s) {
			this.update(s, "");
		};
	};
})();

function hist_init(id)
{
	redraw_hist();
}

function redraw_hist()
{
	document.getElementById(hist_id).innerHTML = hist_to_html();
}

function record_hist(x)
{
	search_history.record(x);
	redraw_hist();
}

function delete_hist(x)
{
	search_history.del(x);
	redraw_hist();
}

function hist_to_html()
{
	var s = "<ul>";
	var histories = search_history.get();
	for(var i=0; i<histories.length; i++) {
		var search_key = histories[i];
		if(search_key.match(/^(tree:|item:|material:|harvest:)(.*)/)) {
			var search_kind = RegExp.$1;
			var name = textToCDATA(RegExp.$2);
			switch(search_kind) {
			case "tree:":
				var class_name = "tree_view_button";
				break;
			case "item:":
				var class_name = "search_by_item_button";
				break;
			case "material:":
				var class_name = "search_by_material_button";
				break;
			case "harvest:":
				var class_name = "search_by_harvest_button";
				break;
			}
			var name = "<span class=" + class_name + "></span> " + name;
			
		} else {
			var name = textToCDATA(search_key);
		}
		s += "<li>" +
			"<span class=\"clickable\" onclick=\"search('" + textToCDATA(search_key) + "','"+result_id+"');\"> " +name + "</span> " +
			"<span class=\"round-square\" onclick=\"delete_hist('" + textToCDATA(search_key) + "');\">×</span>" +
			"</li>";
	}
	s += "</ul>";
	return s;
}
function textToCDATA(s)
{
	s = s.replace(/&/g, "&amp;");
	s = s.replace(/</g, "&lt;");
	s = s.replace(/>/g, "&gt;");
	s = s.replace(/"/g, "&quot;");
	return s;
}
