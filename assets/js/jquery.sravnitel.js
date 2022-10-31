/** 
 * @file jquery.sravnitel.js
 * @version 1.3
 * @brief jquery plugin for comparing multiple images
 * @copyright Copyright (C) 2017 Elphel Inc.
 * @author Oleg Dzhimiev <oleg@elphel.com>
 *
 * @licstart  The following is the entire license notice for the 
 * JavaScript code in this page.
 *
 *   The JavaScript code in this page is free software: you can
 *   redistribute it and/or modify it under the terms of the GNU
 *   General Public License (GNU GPL) as published by the Free Software
 *   Foundation, either version 3 of the License, or (at your option)
 *   any later version.  The code is distributed WITHOUT ANY WARRANTY;
 *   without even the implied warranty of MERCHANTABILITY or FITNESS
 *   FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 *   As additional permission under GNU GPL version 3 section 7, you
 *   may distribute non-source (e.g., minimized or compacted) forms of
 *   that code without the copy of the GNU GPL normally required by
 *   section 4, provided you include this license notice and a URL
 *   through which recipients can access the Corresponding Source.
 *
 *  @licend  The above is the entire license notice
 *  for the JavaScript code in this page.
 */

(function ( $ ) {
  
  // http://stackoverflow.com/questions/5186441/javascript-drag-and-drop-for-touch-devices
  // init_touch();
  
  // https://gist.github.com/leolux/c794fc63d9c362013448
  var SRAVNITEL = function(element,options){
    var elem = $(element);
    var elemID = elem.attr("id");
    
    var obj = this;
    
    var defaults = {
      // urls, comma separated
      images:[],
      // image titles in the same order as url
      titles:[],
      // show or hide titles
      showtitles: false,
      // view window width
      width:100,
      // view window height
      height:200,
      // shoe or hide toggle button
      showtoggle: false,
      // init, left image - is the index of the images array, starting from 0
      index_l: 0,
      // init, right image - is the index of the images array, starting from 0
      index_r: 1,
      // init, zoom==0 - fit image, zoom==1.0 - 100%
      zoom: 0,
      // init, x coordinate of the original image to be placed in the center of the view window
      center_x: 0,
      // init, y coordinate of the original image to be placed in the center of the view window
      center_y: 0
    };
    
    var settings = $.extend(defaults,options);
    
    var tmp = settings.showtitles;
    
    if (typeof tmp == 'string' || tmp instanceof String){
      if ((tmp.toLowerCase()=="false")||(settings.showtitles=="0")){
        settings.showtitles = false;
      }
    }
    
    var images = [];
    
    var tmpimg;
    
    var divider_line_width = 2;
    var divider_handle_size = 30;
    
    var drag_sense_min_px = 10;
    var pinch_sense_min_px = 10;
    
    var x0=0;
    var y0=0;
    
    var toggle_state = 0;
    
    var tmp_display_window;
    //index: 0 - left, 1 - right
    
    //create display windows
    for(var i=0;i<2;i++){
      tmp_display_window = $("<div>",{
        id:   "display_window_"+i,
        class:"display_window"
      }).css({
        position:"absolute",
        left: (settings.width/2)*i+"px",
        width: settings.width/2+"px",
        height: settings.height+"px",
        overflow: "hidden"        
      });
      
      tmp_display_window.attr("index",i);
      
      elem.append(tmp_display_window);
    }
    
    var tmp_display_titles = $("<div>",{
        id: "display_titles",
        class:"titles"
      }).css({
        position:"absolute",
        width: settings.width+"px",
        top: settings.height+"px",
        left: "0px",
        overflow: "hidden"
      });
          
    elem.append(tmp_display_titles);
    
    var tmp_title;
    
    if (settings.images.length>0){
      
      var tmp_table = $("<table>",{class:"titles"}).css({
        width: "100%",
        border: "1px solid rgba(200,200,200,0.5)",
        margin: "0px 0px 0px 0px",
        "text-align": "center"
      });
      
      elem.find("#display_titles").append(tmp_table);
      
      tmp_table.append(
        $("<tr>").append(
          $("<th>",{title:"left image"}).html("left&nbsp;")
        ).append(
          $("<th>",{title:"right image"}).html("right&nbsp;")
        ).append(
          $("<th>",{title:"left image"}).css({"text-align":"left","padding-left":"10px"}).html("title")
        )
      );
      
      for(var i=0;i<settings.images.length;i++){
        if (settings.titles[i] != undefined ){ 
          tmp_title = settings.titles[i];
        }else{
          var tmp_ind = settings.images[i].lastIndexOf("/");
          tmp_title = settings.images[i].substring(tmp_ind+1);
        }
        
        tmp_row = $("<tr>");
        
        for(var j=0;j<2;j++){
          
          tmp_div = $("<div>",{class:"selector_"+j}).css({
            width:"15px",
            height:"15px",
            border: "1px solid rgba(100,100,100,0.5)",
            padding: "1px",
            cursor:"pointer"
          }).append($("<div>").css({
            width:"15px",
            height:"15px",
            background:"rgba(100,200,100,1)"
            })
          );
          
          //tmp_div.attr("mysrc",settings.images[i]);
          tmp_div.attr("index",i);
          tmp_div.attr("side",j);
          
          tmp_div.on("click",function(){
            var tmp_index = $(this).attr("index");
            var tmp_side = $(this).attr("side");
            //console.log(settings.images[tmp_index]);
            elem.find(".selector_"+tmp_side).find("div").hide();
            $(this).find("div").show();
            elem.find("#display_window_"+tmp_side+" .zoomable").attr("src",settings.images[tmp_index]).attr("index",tmp_index);
            reset_selection();
          });
          
          tmp_row.append($("<td>",{align:"center"}).append(tmp_div));
          
        }

        tmp_row.append($("<td>").css({"text-align":"left","padding-left":"10px"}).html(tmp_title));
        tmp_table.append(tmp_row);
 
      }
      
    }
    
    if (settings.showtitles==false){
      //console.log("titles hidden");
      elem.find(".titles").hide();
    }
    
    elem.css({
      width: settings.width+"px",
      height: (settings.height+elem.find("#display_titles").height())+"px"
    });
    
    for(var i=0;i<settings.images.length;i++){
      //initial zoom?!
      tmpimg = $("<img>",{
        id:"image_"+i, 
        src: settings.images[i],
        class: "zoomable"
      }).css({
        position: "absolute",
        width: settings.width+"px"
        //height: settings.height+"px"
      });
      tmpimg.attr("index",i);
      
      images[i] = tmpimg;
      
      //images[i].draggable();
    }
    
    
    if (images.length==1){
      
      image_l = images[0];
      image_r = images[0].clone();
      
      //image_l.draggable();
      image_r.draggable();
      
      elem.find(".selector_0")[0].click();
      elem.find(".selector_1")[0].click();
      
    }else if(images.length>=2){
      image_l = images[settings.index_l];
      image_r = images[settings.index_r];
      elem.find(".selector_0")[settings.index_l].click();
      elem.find(".selector_1")[settings.index_r].click();
      image_r.css({
        left: -settings.width/2+"px"
      });
    }
        
    elem.find(".display_window").each(function(){
      
      var index = $(this).attr("index");
      
      if (index==0) $(this).append(image_l);
      else          $(this).append(image_r);
      
      var tmp_elem = $(this).find(".zoomable");
      tmp_elem.draggable({
        start:function(e){
          x0 = e.pageX;
          y0 = e.pageY;
        },
        drag:function(e){
          var xc = e.pageX;
          var yc = e.pageY;
          sync_images(xc-x0,yc-y0);
          x0 = xc;
          y0 = yc;
        }
      });
      
      tmp_elem.on("click",function(){
        var tmp_index = $(this).parent().attr("index");
        if (tmp_index==0){
          //show right
          place_divider(divider_line_width/2);
          tmp_index = 1;
        }else{
          //shot left
          //place_divider(settings.width-divider_line_width-1);
          place_divider(settings.width-divider_line_width+1);
          tmp_index = 0;
        }
        
        var sindex = elem.find("#display_window_"+tmp_index+" .zoomable").attr("index");
        set_selection(sindex);
      });
    });
    
    var zoom_info = $("<div>",{id:"zoom_info"}).css({
      position:"absolute",
      top:"0px",
      right:"0px"
    });
    
    zoom_info.on("click",function(){
      
      var z = settings.width/elem.find("#display_window_0 .zoomable")[0].naturalWidth;
      var height = z*elem.find("#display_window_0 .zoomable")[0].naturalHeight;
      
      set_zoom(0,0,settings.width,height);
    });
    
    elem.append(zoom_info);
    
    if (settings.showtoggle) init_toggle_button();
  
    $(images[0]).on("load",function(){
      //place_names($(this).height());
      //set zoom here:
      if (settings.zoom!=0){
        
        i_width = settings.zoom*elem.find("#display_window_0 .zoomable")[0].naturalWidth;
        i_height = settings.zoom*elem.find("#display_window_0 .zoomable")[0].naturalHeight;
        i_left = -settings.zoom*settings.center_x+settings.width/2;
        i_top = -settings.zoom*settings.center_y+settings.height/2;
        
        //disable initial zoom
        settings.zoom = 0;
        
        set_zoom(i_top,i_left,i_width,i_height);
      }else{
        //initial images sync height syncing
        zoom_info.click();
      }
      
      update_zoom_info();
    });
    
    init_divider();
    init_zoom();
        
    elem.find(".display_window").each(function(){
      
      this.addEventListener('touchstart',function(e){
        if (e.targetTouches.length>1){
          touch_distance_0 = get_pinch_distance(e);
        }
      });
      
      this.addEventListener('touchmove',function(e){
        if (e.targetTouches.length>1){
          touch_distance_c = get_pinch_distance(e);
          
          var dy = touch_distance_0 - touch_distance_c;
          
          if (Math.abs(dy)>pinch_sense_min_px){
            var i = parseInt($(this).attr("index"));
            
            var touch_center = get_pinch_center(e);
            
            var x = touch_center[0]-$(this).offset().left+i*($(this).position().left);
            var y = touch_center[1]-$(this).offset().top;
            
            elem.find("#display_window_0 .zoomable").each(function(){
              zoom(this,x,y,dy);
            });
            
            touch_distance_0 = touch_distance_c;
          
          }
          
          e.preventDefault();
          e.stopPropagation();
          return false;
          
        }
      });
      
    });
        
    $(window).resize(function(){
      elem.find("#sravnitel_divider").draggable({
        containment:update_divider_containment()
      });
    });
    
    // moved from css
    // taken from http://jsfiddle.net/josedvq/Jyjjx/45/
    elem.find(".round-button").css({
      width: "25%"
    });
    
    elem.find(".round-button-circle").css({
      "border-radius":"2px",
      border: "1px solid rgba(0,0,0,0.5)",
      overflow: "hidden",
      background: "rgba(100,200,100,1)",
      "box-shadow": "0 0 3px rgba(0,0,0,0.5)"
    });
    
    elem.find(".round-button-circle").hover(function(){
      $(this).css({
        background:"rgba(50,50,50,1)"
      });
    },function(){
      $(this).css({
        background:"rgba(100,200,100,1)"
      });      
    });
    
    //end-of-program
        
    function place_divider(x){
      elem.find("#sravnitel_divider").css({
        left: (x-divider_line_width/2)+"px"
      });
      update_display_windows();
    }
    
    function init_divider(){
      
      var divider = $("<div>",{id:"sravnitel_divider"}).css({
        position:"absolute",
        top:"0px"
      });
      
      var tmp_divider_line;
      tmp_divider_line = $("<div>",{id:"divider_line",class:"divider"}).css({
          position:"absolute",
          top:"0px",
          background:"rgba(0,0,0,0.5)",
          border: "1px solid gray",
          width:divider_line_width+"px",
          height:(settings.height)+"px",
//           height:(settings.height-2)+"px",
          cursor:"ew-resize"
      });
      divider.append(tmp_divider_line);
      
      var display_divider_handle = $("<div>",{id:"divider_handle",class:"divider_handle"}).css({
        position:"absolute",
        top: (settings.height/2-divider_handle_size/2)+"px",
        "background-size": divider_handle_size+"px",
        width: divider_handle_size+"px",
        height: divider_handle_size+"px",
        left: -(divider_handle_size/2-divider_line_width/2)+"px",
        cursor:"ew-resize",
        "text-align":"center"
      });

      display_divider_handle.addClass("round-button");
      
      display_divider_handle.append($("<div>",{class:"round-button-circle"}).css({
        width: (divider_handle_size+divider_line_width/2)+"px",
        height: divider_handle_size+"px",
        "line-height": divider_handle_size+"px",
      }));
      
      //html("<span style='color:white'>&#9666;&nbsp;&#9656;</span>")
      
      divider.append(display_divider_handle);
      
      elem.append(divider);
      
      place_divider(settings.width/2);
            
      var tmp_containment = update_divider_containment();
      
      elem.find("#sravnitel_divider").draggable({
        axis:"x",
        //containment:"parent",
        containment:tmp_containment,
        start:function(){
          reset_selection();
        },
        drag:function(){
          $(this).off("mouseout");
          //immediate call
          update_display_windows();
          //delayed call
          setTimeout(function(){
            update_display_windows();
          },10);
        },
        stop:function(){
          $(this).on("mouseout",function(){
            elem.find(".divider").css({
              background:"rgba(0,0,0,0.5)"
            });
          });
        }
      });
      
    }
    
    function reset_selection(){
      elem.find(".titles tr td").css({
        background:"white"
      });
    }
    
    function set_selection(index){
      reset_selection();
      var rows = $(".titles tr");
      elem.find(rows[parseInt(index)+1]).find("td").css({
        background:"rgba(200,200,200,0.5)"
      });
    }
    
    function update_divider_containment(){
      x1 = elem.find("#sravnitel_divider").parent().offset().left;
      y1 = elem.find("#sravnitel_divider").parent().offset().top;
      //x2 = x1+elem.find("#sravnitel_divider").parent().width()-divider_line_width-2;
      x2 = x1+elem.find("#sravnitel_divider").parent().width()-divider_line_width;
      y2 = y1+settings.height;
      return [x1,y1,x2,y2];
    }
    
    function init_zoom(){
      
      elem.find(".display_window").on("mousewheel wheel",function(e){

        // dm = e.originalEvent.deltaMode;
        
        var i = parseInt($(this).attr("index"));
        
        var dx = e.originalEvent.deltaX;
        var dy = e.originalEvent.deltaY;
        var x = e.originalEvent.pageX-$(this).offset().left+i*($(this).position().left);
        var y = e.originalEvent.pageY-$(this).offset().top;
        
        // need only left to set initial zoom
        elem.find("#display_window_0 .zoomable").each(function(){
          zoom(this,x,y,dy);
        });
        
        e.preventDefault();
        e.stopPropagation();
        return false;
        
      });
      
    }
        
    function zoom(elem,x,y,dy){
            
      old_pos = $(elem).position();
      old_x = x-old_pos.left;
      old_y = y-old_pos.top;
      
      old_width = $(elem).width();
      old_height = $(elem).height();
      
      old_zoom = get_zoom();
      
      old_zoom_rounded = Math.round(old_zoom*100)/100;
      old_zoom_rounded = Math.floor(old_zoom_rounded*20)/20;
      
      if (dy>0){
        new_zoom = old_zoom_rounded - 0.05;
      }else{
        new_zoom = old_zoom_rounded + 0.05;
      }
      
      if (new_zoom==0) new_zoom = 0.05;
      
      new_width = new_zoom * old_width / old_zoom;
      new_height = new_zoom * old_height / old_zoom;
      
      k = new_width/old_width;
      
      new_x = x-k*old_x;
      new_y = y-k*old_y;
      
      set_zoom(new_y,new_x,new_width,new_height);
      
    }
  
    function set_zoom(top,left,width,height){
       
      elem.find(".display_window").each(function(){
        var tmp_elem = $(this).find(".zoomable");
        tmp_elem.css({
          top: Math.round(top)+"px",
          left: Math.round(left)-$(this).position().left+"px",
          width: Math.round(width)+"px",
          height: Math.round(height)+"px"
        });
      });
      update_zoom_info();
    }
  
    function update_zoom_info(){
      var z = get_zoom();
      z = Math.round(z*100);
      z = z+" %";
      
      var el = $("<div>",{title:"zoom, click to fit image"}).css({
        color:"white",
        padding: "3px 6px",
        background: "rgba(100,100,100,0.5)",
        cursor: "pointer",
      }).html(z);
      
      elem.find("#zoom_info").html(el);
      
    }

    function get_zoom(){
      return elem.find("#display_window_0 .zoomable").width()/elem.find("#display_window_0 .zoomable")[0].naturalWidth;
    }
  
    function update_display_windows(){
      
      var tmp_left = elem.find("#sravnitel_divider").position().left;
      
      elem.find("#display_window_0").css({
        width: tmp_left+"px"
      });
      
      oldleft = elem.find("#display_window_1").position().left;
      newleft = tmp_left;
      
      deltaleft = newleft - oldleft;
      
      elem.find("#display_window_1").css("left", "+="+deltaleft);
      elem.find("#display_window_1").css("width","-="+deltaleft);
      elem.find("#display_window_1 .zoomable").css("left", "-="+deltaleft);
    }
  
    function sync_images(dx,dy){
      //dx,dy;      
      elem.find(".display_window").each(function(){
        var tmp_elem = $(this).find(".zoomable");
        tmp_elem.css("left","+="+dx);
        tmp_elem.css("top","+="+dy);
      });

    }
  
    function init_toggle_button(){
      var tgl_btn = $("<div>",{id:"toggle_button"}).css({
        position: "absolute",
        bottom: (2+$("#display_titles").height())+"px",
        right: "2px"
      });
      
      var tgl_btn_content = $("<div>",{class:"round-button-circle",title:"Quickly switch between left and right image"}).css({
        color:"white",
        padding: "0px 3px",
        "user-select": "none",
        cursor: "pointer"
      }).html("toggle");
      
      tgl_btn.append(tgl_btn_content);
      
      elem.append(tgl_btn);
      
      tgl_btn_content.on("click",function(){
        elem.find("#display_window_"+toggle_state+" .zoomable").click();
        toggle_state = (toggle_state+1)&0x1;
      });
    }
  
  };
  
  $.fn.sravnitel = function(options){
    var element = $(this);
        
    // Return early if this element already has a plugin instance
    if (element.data('sravnitel')) return element.data('sravnitel');
    
    var sravnitel = new SRAVNITEL(this,options);
    element.data('sravnitel',sravnitel);
    
    var res = new Object();
    res.cnv = element;
    res.data = sravnitel;
    
    return res;
  };
  
}(jQuery));

function get_pinch_distance(e){
  var touches = e.targetTouches;
  var dx = touches[0].pageX-touches[1].pageX;
  var dy = touches[0].pageY-touches[1].pageY;
  return Math.sqrt(dx*dx+dy*dy);
}

function get_pinch_center(e){
  var touches = e.targetTouches;
  var xc = (touches[0].pageX+touches[1].pageX)/2;
  var yc = (touches[0].pageY+touches[1].pageY)/2;
  return [xc,yc];
}
