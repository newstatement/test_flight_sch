

		//---------------------------------------Global Variables----------------------------------------------
		// holds all our rectangles
		var boxes = [];

		var canvas;
		var ctx;
		var WIDTH;
		var HEIGHT;
		var INTERVAL = 20;  // how often, in milliseconds, we check to see if a redraw is needed

		var isDrag = false;
		var mx, my; // mouse coordinates

		// when set to true, the canvas will redraw everything
		// invalidate() just sets this to false right now
		// we want to call invalidate() whenever we make a change
		var canvasValid = false;

		// The node (if any) being selected.
		// If in the future we want to select multiple objects, this will get turned into an array
		var mySel;

		// The selection color and width. Right now we have a red selection with a small width
		var mySelColor = '#CC0000';
		var mySelWidth = 2;

		// we use a fake canvas to draw individual shapes for selection testing
		var ghostcanvas;
		var gctx; // fake canvas context

		// since we can drag from anywhere in a node
		// instead of just its x/y corner, we need to save
		// the offset of the mouse when we start dragging.
		var offsetx, offsety;

		// Padding and border style widths for mouse offsets
		var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

		var Tln = [];

		var FlightsTable = textFileToArray("FlightsTable.txt").split(/\n/g);

		for (var i = 0; i < FlightsTable.length; i++ ) {
			FlightsTable[i] = FlightsTable[i].split(/\t/g);
			if (Tln.indexOf(FlightsTable[i][2]) === -1) {
				Tln.push(FlightsTable[i][2]);
			}
		}

		//---------------------------------------Draw Functions----------------------------------------------

		//Box object to hold data for all drawn rects
		function Box() {
			this.x = 0;
			this.y = 0;
			this.w = 1; // default width and height?
			this.h = 1;
			this.fill = '#444444';
			this.text = "test";
		}

		//Initialize a new Box, add it, and invalidate the canvas
		function addRect(x, y, w, h, fill, text) {
			var rect = new Box;
			rect.x = x;
			rect.y = y;
			rect.w = w;
			rect.h = h;
			rect.fill = fill;
			rect.text = ''; //text;
			boxes.push(rect);
			invalidate();
		}

		// While draw is called as often as the INTERVAL variable demands,
		// It only ever does something if the canvas gets invalidated by our code
		function draw() {
			if (canvasValid == false) {
				clear(ctx);
				drawBoard(WIDTH, HEIGHT, 14, Tln.length);
				// Add stuff you want drawn in the background all the time here

				// draw all boxes

				for (var i = 0; i < boxes.length; i++) {
					boxes[i].text = [ToTime((boxes[i].x/WIDTH*14+6)*3600,2),
						FlightsTable[i][1], FlightsTable[i][4]];
					//boxes[i].text = "teste";
					drawshape(ctx, boxes[i], boxes[i].fill, boxes[i].text);
				}
        //console.log(boxes.length);
				// draw selection
				// right now this is just a stroke along the edge of the selected box
				if (mySel != null) {
					ctx.strokeStyle = mySelColor;
					ctx.lineWidth = mySelWidth;
					ctx.strokeRect(mySel.x,mySel.y,mySel.w+ToNumberTime("00:45")*60,mySel.h);
				}

				// Add stuff you want drawn on top all the time here

				canvasValid = true;
			}
		}


		// Draws a single shape to a single context
		// draw() will call this with the normal canvas
		// myDown will call this with the ghost canvas
		function drawshape(context, shape, fill, text) {

			context.fillStyle = fill;

			// We can skip the drawing of elements that have moved off the screen:
			if (shape.x > WIDTH || shape.y > HEIGHT) return;
			if (shape.x + shape.w < 0 || shape.y + shape.h < 0) return;

			context.fillRect(shape.x,shape.y,shape.w,shape.h);
			context.fillStyle = "hsla(120,0%,50%,0.5)";
			context.fillRect(shape.x+shape.w,shape.y,ToNumberTime("00:45")*60,shape.h);

			context.fillStyle = "hsla(0,0%,25%,1.0)";
			var font = font = "bold 17px arial";
			context.font = font;
			context.textBaseline = "middle";

			//context.fillText(text[0] + " " + text[1] + " " + text[2],shape.x+10,shape.y+shape.h/2);
		}


		//wipes the canvas context
		function clear(c) {
		  c.clearRect(0, 0, WIDTH, HEIGHT);
		}


		function drawBoard(CW, CH, dW, dH){

			var p;

			for (var i = 1; i < dW; i++) {
				p = i*CW/dW;
				ctx.moveTo(p, 0);
				ctx.lineTo(p, CH);
			}

			for (var i = 1; i < dH; i++) {
				p = i*CH/dH;
				ctx.moveTo(0, p);
				ctx.lineTo(CW, p);
			}

			ctx.lineWidth = 0.5;
			ctx.strokeStyle = "rgba(20,20,20,0.8)";
			ctx.stroke();
		}


		//---------------------------------------Mouse Functions----------------------------------------------

		// Happens when the mouse is moving inside the canvas
		function myMove(e){

			if (isDrag){
				getMouse(e);

				mySel.x = mx - offsetx;
				mySel.y = my - offsety;
				mySel.x = Math.round(mySel.x/10)*10;
				mySel.y = 2.5+Math.round(mySel.y/50)*50;

				// something is changing position so we better invalidate the canvas!
				invalidate();
			}
		}

		// Happens when the mouse is clicked in the canvas
		function myDown(e){
			getMouse(e);
			clear(gctx);
			FormSubmit('', '', '', '', '');

			for (var i = 0; i < boxes.length; i++) {
				// draw shape onto ghost context
				drawshape(gctx, boxes[i], 'black', "test");

				// get image data at the mouse x,y pixel
				var imageData = gctx.getImageData(mx, my, 1, 1);
				var index = (mx + my * imageData.width) * 4;

				// if the mouse pixel exists, select and break
				if (imageData.data[3] > 0) {
					//document.body.style.cursor = 'grabbing';
					mySel = boxes[i];
					offsetx = mx - mySel.x;
					offsety = my - mySel.y;
					mySel.x = mx - offsetx;
					mySel.y = my - offsety;
					isDrag = true;
					canvas.onmousemove = myMove;
					invalidate();
					clear(gctx);
					return;
				}
			}
			// havent returned means we have selected nothing
			mySel = null;
			// clear the ghost canvas for next time
			clear(gctx);
			// invalidate because we might need the selection border to disappear
			invalidate();
		}

		function myUp(){
			//document.body.style.cursor = 'pointer';
			isDrag = false;
			canvas.onmousemove = null;
		}

		// adds a new node
		function myDblClick(e) {
			getMouse(e);
			// for this method width and height determine the starting X and Y, too.
			// so I left them as vars in case someone wanted to make them args for something and copy this code
			clear(gctx);

			for (var i = 0; i < boxes.length; i++) {
				// draw shape onto ghost context
				drawshape(gctx, boxes[i], 'black', "test");

				// get image data at the mouse x,y pixel
				var imageData = gctx.getImageData(mx, my, 1, 1);
				var index = (mx + my * imageData.width) * 4;

				// if the mouse pixel exists, select and break
				if (imageData.data[3] > 0) {
					mySel = boxes[i];
					//var now = Date.now();
					//alert(boxes[i].text[1]);
					FormSubmit(i,boxes[i].text[1],
						Tln[Math.round(boxes[i].y/50)],
						ToTime(boxes[i].w*60/2,2),
						boxes[i].text[2]);
					invalidate();
					clear(gctx);
					return;
				}
			}
			// havent returned means we have selected nothing
			mySel = null;
			// clear the ghost canvas for next time
			clear(gctx);
			// invalidate because we might need the selection border to disappear
			invalidate();
		}

		function invalidate() {
		  canvasValid = false;
		}

		// Sets mx,my to the mouse position relative to the canvas
		// unfortunately this can be tricky, we have to worry about padding and borders
		function getMouse(e) {
			var element = canvas, offsetX = 0, offsetY = 0;

			if (element.offsetParent) {
				do {
					offsetX += element.offsetLeft;
					offsetY += element.offsetTop;
				} while ((element = element.offsetParent));
			}

			// Add padding and border style widths to offset
			offsetX += stylePaddingLeft;
			offsetY += stylePaddingTop;

			offsetX += styleBorderLeft;
			offsetY += styleBorderTop;

			mx = e.pageX - offsetX;
			my = e.pageY - offsetY

		}

		// Happens when the mouse is clicked in the canvas
		function changeMouseIcon(e){
			//document.body.style.cursor = 'grabbing';
			getMouse(e);
			clear(gctx);
			//alert('OK');
			//document.body.style.cursor = 'default';
			for (var i = 0; i < boxes.length; i++) {
				// draw shape onto ghost context
				drawshape(gctx, boxes[i], 'black', "test");

				// get image data at the mouse x,y pixel
				var imageData = gctx.getImageData(mx, my, 1, 1);

				// if the mouse pixel exists, select and break
				if (imageData.data[3] > 0) {
					document.body.style.cursor = 'grab';
					invalidate();
					clear(gctx);
					return;
				} else {
					document.body.style.cursor = 'default';
					invalidate();
					clear(gctx);
				}

			}
			// havent returned means we have selected nothing
			mySel = null;
			// clear the ghost canvas for next time
			clear(gctx);
			// invalidate because we might need the selection border to disappear
			invalidate();
		}

		//---------------------------------------Auxiliar functions----------------------------------------------

		function ToTime(TimeNumber, NOpt) {
			var hours   = Math.floor(TimeNumber / 3600);
			var minutes = Math.floor((TimeNumber - (hours * 3600)) / 60);
			var seconds = Math.floor(TimeNumber - (hours * 3600) - (minutes * 60));
			var time = "**:**:**";

			if (hours   < 10) {hours   = "0"+hours;}
			if (minutes < 10) {minutes = "0"+minutes;}
			if (seconds < 10) {seconds = "0"+seconds;}

			time = hours+':'+minutes+':'+seconds;

			if (NOpt == 2) {
				time = hours+':'+minutes;
			}
			else if (NOpt == 3) {
				time = minutes+':'+seconds;
			}
			return time;
		}

		function ToNumberTime(TimeString) {
			var time = TimeString.split(":");
			var hours = 0;
			var minutes = 0;
			var seconds = 0;
			if (time.length > 0) {hours = Math.floor(time[0]);}
			if (time.length > 1) {minutes = Math.floor(time[1])/60;}
			if (time.length > 2) {seconds = Math.floor(time[2])/3600;}

			return (hours + minutes + seconds);
		}

		function textFileToArray( filename )
		{
			var reader = (window.XMLHttpRequest != null )
					   ? new XMLHttpRequest()
					   : new ActiveXObject("Microsoft.XMLHTTP");
			reader.open("GET", filename, false );
			reader.send( );
			return reader.responseText; //.split(/(\r\n|\n)/g)
		}


		//---------------------------------------Initialization----------------------------------------------

		// initialize our canvas, add a ghost canvas, set draw loop
		// then add everything we want to intially exist on the canvas
		function init() {
			canvas = document.getElementById('canvas');
			HEIGHT = canvas.height;
			WIDTH = canvas.width;
			ctx = canvas.getContext('2d');
			ghostcanvas = document.createElement('canvas');
			ghostcanvas.height = HEIGHT;
			ghostcanvas.width = WIDTH;
			gctx = ghostcanvas.getContext('2d');

			//fixes a problem where double clicking causes text to get selected on the canvas
			canvas.onselectstart = function () { return false; }

			// fixes mouse co-ordinate problems when there's a border or padding
			// see getMouse for more detail
			if (document.defaultView && document.defaultView.getComputedStyle) {
				stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
				stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
				styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
				styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
			}

			// make draw() fire every INTERVAL milliseconds
			setInterval(draw, INTERVAL);

			// set our events. Up and down are for dragging,
			// double click is for making new boxes
			canvas.onmousedown = myDown;
			canvas.onmouseup = myUp;
			canvas.ondblclick = myDblClick;
			//canvas.onmousemove = changeMouseIcon;

			// add custom initialization here:

			//var tempColor = "rgba(0,200,0,0.9)";
			//var tempColor = "hsla("+Math.random()*360+",100%,50%,0.9)";
			// add an orange rectangle

			for (var i = 0; i < FlightsTable.length; i++ ) {

				addRect((ToNumberTime(FlightsTable[i][0])-6)*WIDTH/14,
					Tln.indexOf(FlightsTable[i][2])*HEIGHT/Tln.length+2.5,
					ToNumberTime(FlightsTable[i][3])*WIDTH/14,
					HEIGHT/Tln.length-5,
					'hsla(' + FlightsTable[i][4] + ',100%,50%,0.5)',
					FlightsTable[i][1]);
			}

			FormSubmit('', '', '', '', '');

		}

		function sendVal(form) {
			//var i = form.Trilho.value;
			mySel = boxes[form.FlightNumber.value];
			mySel.w = ToNumberTime(form.FlightTime.value)*WIDTH/7;
			mySel.w = ToNumberTime(form.FlightTime.value)*WIDTH/7;
		}

		function FormSubmit(i, MarUnit, TailNumber, FlightTime, Pax) {
			document.getElementById('Atualizar').innerHTML =
			"<font COLOR=black FACE='Geneva, Arial' SIZE=3>" +
			"<input type='hidden' name='FlightNumber' value=" + i + ">" +
			"<table><tr><td>Unidade Marítima:</td><td>Aeronave:</td><td>Tempo de voo:</td><td>Passageiros programados:</td><td></td></tr>" +
			"<tr><td><input type='text' name='MarUnit' value=" + MarUnit + "></td>" +
			"<td><input type='text' name='TailNumber' value=" + TailNumber + "></td>" +
			"<td><input type='time' name='FlightTime' value=" + FlightTime + "></td>" +
			"<td><input type='text' name='Pax' value=" + Pax + "></td>" +
			"<td><input type='button' value='Atualizar' onclick='sendVal(this.form)'></td></tr></table></font>";
		}

		//function TableImport(HMin, HMax, TailNumbers) {
		//	document.getElementById('TableImport').innerHTML =  "teste";
		//}

		function TableImport() {
			var Th =
			"<tr>" +
				"<td></td>" +
				"<td>06:00</td><td>07:00</td>" +
				"<td>08:00</td><td>09:00</td>" +
				"<td>10:00</td><td>11:00</td>" +
				"<td>12:00</td><td>13:00</td>" +
				"<td>14:00</td><td>15:00</td>" +
				"<td>16:00</td><td>17:00</td>" +
				"<td>18:00</td><td>19:00</td>" +
			"</tr>" +
			"<tr>" +
				"<td>" + Tln[0] + "</td> <td colspan='14' rowspan=" + Tln.length + ">" +
					"<canvas id='canvas' width='830' height=" + (50 * Tln.length) + " style='border:1px solid #00000050'>" +
						"Your browser does not support the HTML5 canvas tag." +
					"</canvas>" +
				"</td>" +
			"</tr>";
			for (var i = 1; i <= Tln.length - 1; i++) {
				Th = Th + "<tr><td>" + Tln[i] + "</td></tr>";
			}

			document.getElementById('UpdateScheduleTable').innerHTML = Th;
		}

		function HTMLFlightsTable(FlightsTables) {
			var CellsValue = '';
			for (var i = 0; i < FlightsTables.length; i++) {
				CellsValue = CellsValue + '<tr>';
				for (var j = 0; j < FlightsTables[0].length; j++) {
					CellsValue = CellsValue + '<td>' + FlightsTables[i][j] + '</td>';
				}
				CellsValue = CellsValue + '</tr>';
			}

			document.getElementById('UpdateTable').innerHTML = CellsValue;
		}
		HTMLFlightsTable(FlightsTable);
		TableImport();
		// If you dont want to use <body onLoad='init()'>
		// You could uncomment this init() reference and place the script reference inside the body tag
		init();
	</script>
  <style>
table {
	font-family: "Arial";
	font-size: 17px;
	font-weight: bold;
	color: hsl(0,0%,25%);
}


