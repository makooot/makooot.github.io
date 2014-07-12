function draw(form_id, result_id, exptable_id)
{
  init_result(result_id);
  draw_exptable(exptable_id, result_id);
}

function draw_exptable(id, result_id)
{
  var exp_for_next = make_exp_table();
  var exp_for_level = []
  var results = document.getElementById(result_id).childNodes
  for(var i=0; i<results.length; i++) {
    var r = results[i]
    if(r.dataset && r.dataset.toLevel) {
      var to_level = parseInt(r.dataset.toLevel)
      exp_for_level.push([to_level, make_exp_total(to_level, exp_for_next)])
    }
  }
  document.getElementById(id).innerHTML = exp_table_to_html(exp_for_next, exp_for_level);
}

function exp_table_to_html(exp_for_next, exp_for_level)
{
  var s = "";
  s += "<table id=pet_exp_table>";
  s += "<tr>";
  s += "<th rowspan=2>ペットレベル</th>";
  s += "<th colspan="  + (exp_for_level.length+1) + ">必要経験値</th>";
  s += "</tr>";
  s += "<tr>";
  s += "<th>次のレベルまで</th>";
  for(var i=0; i<exp_for_level.length; i++) {
    s += "<th>レベル " + exp_for_level[i][0] + "まで</th>";
  }
  s += "</tr>";
  for(var level=1; level<50; level++) {
    s += "<tr>";
    s += "<td>" + level + "</td>";
    s += "<td id=exp_" + level + "_next>" + to_comma_separated_string(exp_for_next[level]) +"</td>";
    for(var i=0; i<exp_for_level.length; i++) {
      if(typeof(exp_for_level[i][1][level])=="number") {
        s += "<td id=exp_" + level + "_" + exp_for_level[i][0] + ">" + to_comma_separated_string(exp_for_level[i][1][level]) + "</td>";
      } else {
        s += "<td class=not_active>-</td>";
      }
    }
    s += "</tr>";
  }
  s += "</table>";

  return s;
}

function to_comma_separated_string(n)
{
  var s = "" + n;
  var l = n<0 ? 1 : 0;
  var r = s.indexOf(".");
  if(r==-1) {
    r = s.length;
  }
  r -= 3;
  while(l<r) {
    s = s.slice(0, r) + "," + s.slice(r);
    r -= 3;
  }
  return s;
}

function parse_comma_separated_int(s)
{
  if(s.match(/^[0-9,]+$/)) {
    return parseInt(s.replace(/,/g, ""));
  } else {
    return null;
  }
}

function make_exp_table()
{
  var exp_table = [];

  exp_table[0] = 0;
  for(var level=1; level<50; level++) {
    var exp_incremental = 50 + (level-1) * 100;
    exp_table[level] = exp_table[level-1] + exp_incremental;
  }

  return exp_table;
}

function make_exp_total(to_level, exp_for_next)
{
  var exp_table = [];
  for(var level=1; level<to_level; level++) {
    var exp_slice = exp_for_next.slice(level, to_level);
    exp_table[level] = exp_slice.reduce(function(a, b){return a+b;});
  }
  return exp_table;
}

function calculate(level_value, exp_value, result_id, status_id, exptable_id)
{
  var now_level = parse_comma_separated_int(level_value)
  var now_exp = parse_comma_separated_int(exp_value)
  if(isNaN(now_level) || now_level<1 || now_level>49) {
    alert("レベルは1から49の間で指定してください")
    return
  }
  if(isNaN(now_exp) || now_exp<0) {
    alert("経験値は0以上の数を指定してください")
    return
  }
  var exp_to_next = parse_comma_separated_int(document.getElementById("exp_"+now_level+"_next").innerText)
  if(now_exp>=exp_to_next) {
    alert("経験値 " + to_comma_separated_string(now_exp) + "/" + to_comma_separated_string(exp_to_next) +
          "\nに、なっています\n見直してください")
    return
  }
  var results = document.getElementById(result_id).childNodes
  for(var i=0; i<results.length; i++) {
    var r = results[i]
    if(r.dataset && r.dataset.toLevel) {
      var to_level = parseInt(r.dataset.toLevel)
      var s = "<div class=result-headder>レベル" + to_level + "まで</div>"
      if(now_level<to_level) {
        var exp = parse_comma_separated_int(document.getElementById("exp_"+now_level+"_"+to_level).innerText)
        exp -= now_exp
        var bagle = Math.ceil(exp / 50000)
        var remainder_exp = exp % 50000
        s += "経験値 " + to_comma_separated_string(exp) + "<br />"
        s += "ベーグル " + bagle + "個<br />"
        s += "<span class=result-supplement>経験値をあと " + to_comma_separated_string(remainder_exp) + " 稼ぐと、ベーグル1個節約できます</span>"
      } else {
        s += "<span class=done-stamp></span>"
      }
      r.innerHTML = s
    }
  }

  document.getElementById(status_id).innerHTML = "レベル " + level_value + "、経験値 " + exp_value + "からの必要ペットベーグル数"
}

function init_result(result_id)
{
  var results = document.getElementById(result_id).childNodes
  for(var i=0; i<results.length; i++) {
    var r = results[i]
    if(r.dataset && r.dataset.toLevel) {
      var to_level = parseInt(r.dataset.toLevel)
      r.innerHTML = "<div class=result-headder>レベル" + to_level + "まで</div>"
    }
  }

}
