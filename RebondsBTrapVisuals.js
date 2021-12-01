var audio; //audio file
var fr = 60;  //frames per second
var currentTime; //time of audio (not counting silence at beginning)
var onScreenHits = []; //array of on-screen events
var onScreenHits2 = []; //array of on-screen events (2nd layer for occasional use (16th woodblocks/rolls and ending))
var tempo = 60; //tempo(BPM) of audio
var beatToggle = true; // boolean variable, makes sure each if-black only happens once (by toggeling back and forth)
var beatCount = 0; //couting beats (for 32nd note sections)
var woodblockToColor; //dictionary for woodblock colors

function preload(){
  audio = loadSound("data/rebondsB_lowQual.mp3");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(fr);
  ellipseMode(CENTER);
  strokeCap(PROJECT);
  //create woodblock color dictionary
  woodblockToColor =  createStringDict();
  woodblockToColor.create(1,'(255,255,0');
  woodblockToColor.create(2,'(255,0,255');
  woodblockToColor.create(3,'(0,255,0');
  woodblockToColor.create(4,'(0,255,255');
  woodblockToColor.create(5,'(255,127,0');
  //create title divs
  title = createDiv("Iannis Xenakis - Rebonds B");
  subtitle =  createDiv("(Boris   Kish   Remix)");
  subtitle2 = createDiv("click the mouse to start");
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


//superclass for each instrument
class Hit {
  constructor(){}
  update(){}
  display(){}
  isOffScreen(){};
  getEndPos(){};
  getAngle(){
    return random(2*PI);
  }
}

class Drum extends Hit{
  constructor(positionArray) {
    super();
    this.x = positionArray[0];
    this.y = positionArray[1];
    this.diameter = 0;
    this.duration = 0; //duration in frames
    this.maxDuration = 0; //max duration
    this.color = [255,255,255];
  }

  //update by counting down
  update(){
    this.duration--;
  }

  display(){
    noStroke();
    fill(this.color[0],this.color[1],this.color[2],map(this.duration,0,this.maxDuration, 0,255));  //map duration to transparency
    ellipse(this.x,this.y,this.diameter,this.diameter);
  }

  isOffScreen(){
    return (this.duration<0) ;
  }

  getEndPos(){
    return [this.x,this.y];
  }

  getX(){
    return this.x;
  }

  getY(){
    return this.y;
  }

  getDiameter(){
    return this.diameter;
  }

  setPosition(positionArray){
    this.x = positionArray[0];
    this.y = positionArray[1];
  }

  setDuration(duration){
    this.duration = duration; //duration in frames
    this.maxDuration = duration;//max duration
  }

}

//normal hiHat
class HiHat extends Drum{
  constructor(){
    super(randomPosition(width/2,height/2,random(height/2),random(2*PI)));
    this.diameter = windowHeight/6;
    this.duration = fr/2;
    this.maxDuration =  this.duration;
  }

}
//hiHat with accent
class HiHatAccent extends HiHat{
  constructor(){
    super();
    this.diameter = windowHeight/3;
    this.duration = fr;
    this.maxDuration =  this.duration;
  }
}
//drum 1 (when playing 32nd notes with hi-hat)
class Drum1 extends Drum{
  constructor(){
    if((currentTime>33*4 && currentTime<=(34+3/8)*4) ){ //drum roll positioning
      //  print("roll constructor");
    super(randomPosition(width/2,height/2,random(map(currentTime,33*4,(34+3/8)*4,0,windowWidth/2)),random(2*PI)));
    this.diameter = map(currentTime,33*4,(34+3/8)*4,windowWidth/6,windowWidth/18);
    this.duration = fr/2;
    }
    else if(currentTime>(71+7/8)*4 && currentTime<(72)*4){
    super(randomPosition(width/2,height/2,random(height/8),random(2*PI)));
    this.diameter = map(currentTime,(71+7/8)*4,(72)*4,0,windowHeight/4);
    this.duration = fr/4;
    }
    else{
    super(randomPosition(width/2,height/2,random(height/2),random(2*PI)));
    this.diameter = windowHeight/3;
    this.duration = fr;
    }
    this.maxDuration =  this.duration;
    this.color = [255,127,0];
  }
}
//hiHat double
//needs to be pushed onto eventList 1/16 note early (to catch 1/32 note drag)
class HiHatDouble extends HiHat{
  constructor(){
    super();
    this.startTime = frameCount;
    this.diameter2 = this.diameter;
    this.elapsedTime=0; //diameter of final hit (for double accents )
    //print("double has been instantiated. start time is "+this.startTime);
  }

  update(){
    if(this.elapsedTime>=fr*(1/4)*(tempo/60)){ //after 1/16 note start fading
      //print("duration is "+this.duration);
      this.duration--;
    }
  }

  display(){
    this.elapsedTime =  frameCount - this.startTime;
    //print("elapsed time is "+elapsedTime);
    noStroke();
    if(this.elapsedTime>=fr*(1/4)*(tempo/120) && this.elapsedTime<fr*(1/4)*(tempo/120+tempo/480)){ //first double display
      //  print("double 1");
      fill(this.color[0],this.color[1],this.color[2]);
      ellipse(this.x,this.y,this.diameter,this.diameter);
    }
    if(this.elapsedTime>=fr*(1/4)*(tempo/80) && fr*(1/4)*(this.elapsedTime<tempo/80+tempo/480)){ //second double display
      //print("double 2");
      fill(this.color[0],this.color[1],this.color[2]);
      ellipse(this.x,this.y,this.diameter,this.diameter);
    }
    if(this.elapsedTime>=fr*(1/4)*(tempo/60)){  //actual hit (with fade)
      //print("main hit");
      fill(this.color[0],this.color[1],this.color[2],map(this.duration,0,this.maxDuration, 0,255));  //map duration to transparency
      ellipse(this.x,this.y,this.diameter2,this.diameter2);
    }
  }
}
class HiHatfffDouble extends HiHatDouble{
  constructor(){
    super();
    this.diameter = windowHeight/3;
  }
}
class HiHatDoubleAccent extends HiHatDouble{
  constructor(){
    super();
    this.diameter2 = windowHeight/3;
  }
}

//snare drum
class Snare extends Drum{
  constructor(){
    if((currentTime>(7+3/16)*4 && currentTime<=(8+1/4)*4)||(currentTime>(15+5/8)*4 && currentTime<=(17+3/8)*4) ){
      super(randomPosition(width/2,height/2,random(height/2),random(PI/2,3*PI/2)));
      this.diameter = windowHeight/2;
      this.duration = fr/2;
    }
    else{
    super(randomPosition(width/2,height/2,random(height/2),random(PI/2,3*PI/2)));
    this.diameter = windowHeight/2;
    this.duration = fr;
  }
    this.maxDuration =  this.duration;
    this.color = [255,0,0];
  }
}

class Drum2 extends Drum{
  constructor(){
    //drumming runs (short duration)
    if((currentTime>(7+3/16)*4 && currentTime<=(8+1/4)*4)||(currentTime>(15+5/8)*4 && currentTime<=(17+3/8)*4)||(currentTime>(43-6/32)*4 && currentTime<=(45+3/4)*4)||(currentTime>(55+7/16)*4 && currentTime<=(56+9/16)*4)||(currentTime>(74+1/2)*4 && currentTime<=(78+10/16)*4) ||(currentTime>(83+6/16)*4 && currentTime<=(85+1/4)*4)){
      super(randomPosition(width/2,height/2,random(height/2),random(PI/2,3*PI/2)));
      this.diameter = windowHeight/2;
      this.duration = fr/2;
    }
    else if(currentTime>(72)*4 && currentTime<(72+3/8)*4){ //drum roll (with volume shaping)
      super(randomPosition(width/3,height/2,random(height/8),random(2*PI)));
      this.duration = fr/4;
      if(currentTime<(72+1/8)*4){ //start of roll
        this.diameter = map(currentTime,(72)*4,(72+1/8)*4,windowHeight/4,windowHeight/2);
      }
      else{
        this.diameter = map(currentTime,(72+1/8)*4,(72+3/8)*4,windowHeight/2,0);
      }
    }
    else if(currentTime>(78+5/8)*4 && currentTime<(83+6/16)*4 || currentTime>(85+1/4)*4) { //ending drum rolls
      super(randomPosition(width/3,height/2,random(windowHeight/4),random(2*PI)));
      this.duration = fr/4;
      this.diameter = windowHeight/2;
    }
    else{
    super(randomPosition(width/2,height/2,random(height/2),random(PI/2,3*PI/2)));
    this.diameter = windowHeight/2;
    this.duration = fr;
  }
    this.maxDuration =  this.duration;
    this.color = [128,0,0];
  }
}
// tumba
class Drum3 extends Drum{
  constructor(){
    //drumming runs (short duration)
    if((currentTime>(7+3/16)*4 && currentTime<=(8+1/4)*4)||(currentTime>(15+5/8)*4 && currentTime<=(17+3/8)*4) || (currentTime>(43-6/32)*4 && currentTime<=(45+3/4)*4)||(currentTime>(55+7/16)*4 && currentTime<=(56+9/16)*4)||(currentTime>(74+1/2)*4 && currentTime<=(78+10/16)*4) ||(currentTime>(83+6/16)*4 && currentTime<=(85+1/4)*4)){
      super(randomPosition(width/2,height/2,random(height/2),random(3*PI/2,5*PI/2)));
      this.diameter = 2*windowHeight/3;
      this.duration = fr/2;
    }
    else if(currentTime>(72+3/8)*4 && currentTime<(72+7/8)*4){ //drum roll (with volume shaping)
      super(randomPosition(2*width/3,height/2,random(height/8),random(2*PI)));
      this.duration = fr/4;
      if(currentTime<(72+5/8)*4){ //start of roll
        this.diameter = map(currentTime,(72+3/8)*4,(72+5/8)*4,0,2*windowHeight/3);
      }
      else{
        this.diameter = map(currentTime,(72+5/8)*4,(72+7/8)*4,2*windowHeight/3,0);
      }
    }
    else if(currentTime>(78+5/8)*4 && currentTime<(83+6/16)*4 || currentTime>(85+1/4)*4){ //ending drum rolls
      super(randomPosition(2*width/3,height/2,random(2*windowHeight/6),random(2*PI)));
      this.duration = fr/4;
      this.diameter = 2*windowHeight/3;
    }
    else{
    super(randomPosition(width/2,height/2,random(height/2),random(3*PI/2,5*PI/2)));
    this.diameter = 2*windowHeight/3;
    this.duration = fr;
  }
    this.maxDuration =  this.duration;
    this.color = [0,128,64];

  }
}
//low tom drum
class Drum4 extends Drum{
  constructor(){
    //drumming runs (short duration)
    if((currentTime>(7+3/16)*4 && currentTime<=(8+1/4)*4)||(currentTime>(15+5/8)*4 && currentTime<=(17+3/8)*4)  ||  (currentTime>(43-6/32)*4 && currentTime<=(45+3/4)*4)||(currentTime>(55+7/16)*4 && currentTime<=(56+9/16)*4)||(currentTime>(74+1/2)*4 && currentTime<=(78+10/16)*4) ||(currentTime>(83+6/16)*4 && currentTime<=(85+1/4)*4)){
      super(randomPosition(width/4,height/2,random(width/4),random(2*PI)));
      this.diameter = 1.5*windowHeight;
      this.duration = fr/2;
    }
    else if(currentTime>(72+7/8)*4 && currentTime<(73+3/8)*4){ //drum roll (with volume shaping)
      super(randomPosition(width/6,height/2,random(height/8),random(2*PI)));
      this.duration = fr/4;
      if(currentTime<(73+1/8)*4){ //start of roll
        this.diameter = map(currentTime,(72+7/8)*4,(73+1/8)*4,0,1.5*windowHeight);
      }
      else{
        this.diameter = map(currentTime,(73+1/8)*4,(73+3/8)*4,1.5*windowHeight,0);
      }
    }
    else if(currentTime>(78+5/8)*4 && currentTime<(83+6/16)*4|| currentTime>(85+1/4)*4){ //ending drum rolls
      super(randomPosition(width/6,height/2,random(1.5*windowHeight/2),random(2*PI)));
      this.duration = fr/4;
      this.diameter = 1.5*windowHeight;
    }
    else{
    super(randomPosition(width/4,height/2,random(width/4),random(2*PI)));
    this.diameter = 1.5*windowHeight;
    this.duration = 2*fr;
  }
    this.maxDuration =  this.duration;
    this.color = [0,64,128];

  }
}
//bass drum
class Drum5 extends Drum{
  constructor(){
    //drumming runs (short duration)
    if((currentTime>(7+3/16)*4 && currentTime<=(8+1/4)*4)||(currentTime>(15+5/8)*4 && currentTime<=(17+3/8)*4)  ||  (currentTime>(43-6/32)*4 && currentTime<=(45+3/4)*4)||(currentTime>(55+7/16)*4 && currentTime<=(56+9/16)*4)||(currentTime>(74+1/2)*4 && currentTime<=(78+10/16)*4) ||(currentTime>(83+6/16)*4 && currentTime<=(85+1/4)*4)){ //short fade time (melodic runs)
      super(randomPosition(3*width/4,height/2,random(width/4),random(2*PI)));
      this.diameter = windowHeight;
      this.duration = fr/2;
    }
    else if((currentTime>(45+3/4)*4 && currentTime<=(47)*4) ){ //drum roll 2 positioning/shape
      //print("roll constructor");
      super(randomPosition(width/2,height/2,random(map(currentTime,(45+3/4)*4,(47-1/8)*4,windowWidth/8,windowWidth/2)),random(2*PI)));
      this.duration = fr/4;
      this.diameter = map(currentTime,(45+3/4)*4,(47-1/8)*4,windowWidth/8,windowWidth/2);
    }
    else if(currentTime>(73+3/8)*4 && currentTime<(73+6/8)*4){ //drum roll (with volume shaping)
      super(randomPosition(5*width/6,height/2,random(height/8),random(2*PI)));
      this.duration = fr/4;
      this.diameter = map(currentTime,(73+3/8)*4,(73+6/8)*4,0,2*windowHeight);
    }
    else if(currentTime>(78+5/8)*4 && currentTime<(83+6/16)*4 || currentTime>(85+1/4)*4 && currentTime<(86+19/38)*4){ //ending drum rolls
      super(randomPosition(5*width/6,height/2,random(windowHeight/2),random(2*PI)));
      this.duration = fr/4;
      this.diameter = windowHeight;
    }
    else if(currentTime>(86+19/36)*4 && currentTime<(87)*4){ //ending roll stage 1 - move drum pos to center
      super(randomPosition(map(currentTime,(86+19/36)*4,(87)*4,5*width/6,width/2),windowHeight/2,random(height/4),random(2*PI)));
      this.duration = map(currentTime,(86+19/36)*4,(87)*4,fr/4,fr/8);
      this.diameter = windowHeight;
    }
    else if(currentTime>(87)*4 && currentTime<(87+11/16)*4){
      super(randomPosition(width/2,height/2,random(map(currentTime,(87)*4,(87+11/16)*4,windowHeight,2*windowHeight)/2),random(2*PI)));
      this.duration = fr/8;
      this.diameter = map(currentTime,(87)*4,(87+11/16)*4,windowHeight,2*windowHeight);
    }
    else if(currentTime>(87+11/16)*4 && currentTime<(88+3/4)*4){
      super(randomPosition(width/2,height/2,random(windowHeight),random(2*PI)));
      this.duration = map(currentTime,(87+11/16)*4,(88+3/4)*4,fr/8,fr/16);
      this.diameter = map(currentTime,(87+11/16)*4,(88+3/4)*4,2*windowHeight,1.5*windowHeight);
    }
    else if(currentTime>(88+3/4)*4 && currentTime<(89+1/2)*4){
      super(randomPosition(width/2,height/2,random(windowHeight),random(2*PI)));
      this.duration = fr/16;
      this.diameter = map(currentTime,(88+3/4)*4,(89+1/2)*4,1.5*windowHeight,.1*windowHeight, true);
    }
    else if(currentTime >= 4*(89+1/2) && currentTime%4 < 4*(89 +9/16)){
      super(randomPosition(width/2,height/2,random(windowHeight),random(2*PI)));
      this.duration = 2*fr;
      this.diameter = 1.5*windowHeight;
    }
    else{
      super(randomPosition(3*width/4,height/2,random(width/4),random(2*PI)));
      this.duration = 2*fr;
      this.diameter = windowHeight;
    }
    this.maxDuration =  this.duration;
    this.color = [64,0,128];
  }
}
//drum triple strokes
class DrumBurst {
  constructor(drum){
    if(drum==2){
      this.drum0 = new Drum2();
      this.drum1 = new Drum2();
      this.drum2 = new Drum2();
    }
    if(drum==3){
      this.drum0 = new Drum3();
      this.drum1 = new Drum3();
      this.drum2 = new Drum3();
    }
    if(drum==4){
      this.drum0 = new Drum4();
      this.drum1 = new Drum4();
      this.drum2 = new Drum4();
    }
    if(drum==5){
      this.drum0 = new Drum5();
      this.drum1 = new Drum5();
      this.drum2 = new Drum5();
    }
    //  this.burst = [this.drum0,this.drum1,this.drum2];
    this.xPos = this.drum2.getX();
    this.yPos = this.drum2.getY();
    this.diameter = this.drum0.getDiameter();
    //change position of 1nd and 2rd drums (to be next to last)
    this.drum0.setPosition(randomPosition(this.xPos,this.yPos,random(this.diameter/4,3*this.diameter/4),random(2*PI)));
    this.drum1.setPosition(randomPosition(this.xPos,this.yPos,random(this.diameter/4,3*this.diameter/4),random(2*PI)));
    //make drumbursts fade faster
    this.drum0.setDuration(fr/2);
    this.drum1.setDuration(fr/2);
    this.drum2.setDuration(fr);
    this.startTime = frameCount;
    this.elapsedTime = 0;
    this.sixteenthLength = fr*(1/4)*(tempo/60); //number of frames in 1/16th note
  }

  display(){
    if(this.elapsedTime<(1/4)*this.sixteenthLength){
      //print("stage 1 display");
      this.drum0.display();
    }
    else if(this.elapsedTime<(1/2)*this.sixteenthLength){
      //  print("stage 2 display");
      this.drum0.display();
      this.drum1.display();
    }
    else{
      //  print("stage 3 display");
      this.drum0.display();
      this.drum1.display();
      this.drum2.display();
    }
  }

  update(){
    this.elapsedTime = frameCount - this.startTime;
    if(this.elapsedTime<(1/4)*this.sixteenthLength){
      //print("stage 1 update");
      this.drum0.update();
    }
    else if(this.elapsedTime<(1/2)*this.sixteenthLength){
      //  print("stage 2 update");
      this.drum0.update();
      this.drum1.update();
    }
    else{
      //  print("stage 3 update");
      this.drum0.update();
      this.drum1.update();
      this.drum2.update();
    }
  }
  isOffScreen(){
    return this.drum2.isOffScreen();
  }
}
//needs to be pushed onto eventList 1/16 note early (to catch 1/32 note drag)
class SnareDouble extends Snare{
  constructor(){
    super();
    this.startTime = frameCount;
    this.diameter2 = this.diameter; //diameter of final hit (for double accents )
    this.elapsedTime=0;
    //print("double has been instantiated. start time is "+this.startTime);
  }

  update(){
    if(this.elapsedTime>=fr*(1/4)*(tempo/60)){ //after 1/16 note start fading
      //print("duration is "+this.duration);
      this.duration--;
    }
  }

  display(){
    this.elapsedTime =  frameCount - this.startTime;
    //print("elapsed time is "+this.elapsedTime);
    noStroke();
    if(this.elapsedTime>=fr*(1/4)*(tempo/120) && this.elapsedTime<fr*(1/4)*(tempo/120+tempo/480)){ //first double display
      //  print("double 1");
      fill(this.color[0],this.color[1],this.color[2]);
      ellipse(this.x,this.y,this.diameter,this.diameter);
    }
    if(this.elapsedTime>=fr*(1/4)*(tempo/80) && fr*(1/4)*(this.elapsedTime<tempo/80+tempo/480)){ //second double display
      //print("double 2");
      fill(this.color[0],this.color[1],this.color[2]);
      ellipse(this.x,this.y,this.diameter,this.diameter);
    }
    if(this.elapsedTime>=fr*(1/4)*(tempo/60)){  //actual hit (with fade)
      //print("main hit");
      fill(this.color[0],this.color[1],this.color[2],map(this.duration,0,this.maxDuration, 0,255));  //map duration to transparency
      ellipse(this.x,this.y,this.diameter2,this.diameter2);
    }
  }
}
class Drum3Double extends Drum3{
  constructor(){
    super();
    this.startTime = frameCount;
    this.diameter2 = this.diameter; //diameter of final hit (for double accents )
    this.elapsedTime=0;
    //print("double has been instantiated. start time is "+this.startTime);
  }

  update(){
    if(this.elapsedTime>=fr*(1/4)*(tempo/60)){ //after 1/16 note start fading
      //print("duration is "+this.duration);
      this.duration--;
    }
  }

  display(){
    this.elapsedTime =  frameCount - this.startTime;
    //print("elapsed time is "+this.elapsedTime);
    noStroke();
    if(this.elapsedTime>=fr*(1/4)*(tempo/120) && this.elapsedTime<fr*(1/4)*(tempo/120+tempo/480)){ //first double display
      //  print("double 1");
      fill(this.color[0],this.color[1],this.color[2]);
      ellipse(this.x,this.y,this.diameter,this.diameter);
    }
    if(this.elapsedTime>=fr*(1/4)*(tempo/80) && fr*(1/4)*(this.elapsedTime<tempo/80+tempo/480)){ //second double display
      //print("double 2");
      fill(this.color[0],this.color[1],this.color[2]);
      ellipse(this.x,this.y,this.diameter,this.diameter);
    }
    if(this.elapsedTime>=fr*(1/4)*(tempo/60)){  //actual hit (with fade)
      //print("main hit");
      fill(this.color[0],this.color[1],this.color[2],map(this.duration,0,this.maxDuration, 0,255));  //map duration to transparency
      ellipse(this.x,this.y,this.diameter2,this.diameter2);
    }
  }
}
class Drum4Double extends Drum4{
  constructor(){
    super();
    this.startTime = frameCount;
    this.diameter2 = this.diameter; //diameter of final hit (for double accents )
    this.elapsedTime=0;
    //print("double has been instantiated. start time is "+this.startTime);
  }

  update(){
    if(this.elapsedTime>=fr*(1/4)*(tempo/60)){ //after 1/16 note start fading
      //print("duration is "+this.duration);
      this.duration--;
    }
  }

  display(){
    this.elapsedTime =  frameCount - this.startTime;
    //print("elapsed time is "+this.elapsedTime);
    noStroke();
    if(this.elapsedTime>=fr*(1/4)*(tempo/120) && this.elapsedTime<fr*(1/4)*(tempo/120+tempo/480)){ //first double display
      //  print("double 1");
      fill(this.color[0],this.color[1],this.color[2]);
      ellipse(this.x,this.y,this.diameter,this.diameter);
    }
    if(this.elapsedTime>=fr*(1/4)*(tempo/80) && fr*(1/4)*(this.elapsedTime<tempo/80+tempo/480)){ //second double display
      //print("double 2");
      fill(this.color[0],this.color[1],this.color[2]);
      ellipse(this.x,this.y,this.diameter,this.diameter);
    }
    if(this.elapsedTime>=fr*(1/4)*(tempo/60)){  //actual hit (with fade)
      //print("main hit");
      fill(this.color[0],this.color[1],this.color[2],map(this.duration,0,this.maxDuration, 0,255));  //map duration to transparency
      ellipse(this.x,this.y,this.diameter2,this.diameter2);
    }
  }
}
class Drum5Double extends Drum5{
  constructor(){
    super();
    this.startTime = frameCount;
    this.diameter2 = this.diameter; //diameter of final hit (for double accents )
    this.elapsedTime=0;
    //print("double has been instantiated. start time is "+this.startTime);
  }

  update(){
    if(this.elapsedTime>=fr*(1/4)*(tempo/60)){ //after 1/16 note start fading
      //print("duration is "+this.duration);
      this.duration--;
    }
  }

  display(){
    this.elapsedTime =  frameCount - this.startTime;
    //print("elapsed time is "+this.elapsedTime);
    noStroke();
    if(this.elapsedTime>=fr*(1/4)*(tempo/120) && this.elapsedTime<fr*(1/4)*(tempo/120+tempo/480)){ //first double display
      //  print("double 1");
      fill(this.color[0],this.color[1],this.color[2]);
      ellipse(this.x,this.y,this.diameter,this.diameter);
    }
    if(this.elapsedTime>=fr*(1/4)*(tempo/80) && fr*(1/4)*(this.elapsedTime<tempo/80+tempo/480)){ //second double display
      //print("double 2");
      fill(this.color[0],this.color[1],this.color[2]);
      ellipse(this.x,this.y,this.diameter,this.diameter);
    }
    if(this.elapsedTime>=fr*(1/4)*(tempo/60)){  //actual hit (with fade)
      //print("main hit");
      fill(this.color[0],this.color[1],this.color[2],map(this.duration,0,this.maxDuration, 0,255));  //map duration to transparency
      ellipse(this.x,this.y,this.diameter2,this.diameter2);
    }
  }
}

class Woodblock extends Hit{
  constructor(woodblock){
    super();
    //i need to create temp variables seperatly and load them into start/particle position (or else bugs for some reason??)
    this.woodBlockNum = woodblock; //which woodblock are you
    this.angle = 0; //position angle of starting point (on circle)
    this.tempStart= this.startPoint(); //get starting point
    this.particlePos = [this.tempStart[0],this.tempStart[1]];
    this.startPos =  [this.tempStart[0],this.tempStart[1]];
    this.endPos = this.endPoint(); //get ending point
    this.travelTime = (1/8)*fr; //time spent moving
    this.fadeTime = (1/2)*fr; //time speny fading
    this.particleTime = 0; //elapsed time of particle
    if(currentTime>(70+7/8)*4 && currentTime<(71+7/8)*4){
    this.alpha = map(currentTime,(70+7/8)*4,(71+7/8)*4,1,.25,true);
    this.stroke = map(currentTime,(70+7/8)*4,(71+7/8)*4,64,0,true);
    }
    else if(currentTime > 4*(87)){
      this.alpha = 1;
      this.stroke = map(currentTime,(87)*4,(89+1/4)*4,64,1,true);
    }
    else{
    this.alpha = 1;
    this.stroke = 64;
    }
  }
  update(){
    //  print("woodblock update")
    this.particleTime++;
    if(this.particleTime<=this.travelTime){
      this.particlePos[0]+= (1/this.travelTime)*(this.endPos[0]-this.startPos[0]);
      this.particlePos[1]+= (1/this.travelTime)*(this.endPos[1]-this.startPos[1]);
    }
    //  print("particle time is "+this.particleTime);
  }
  display(){
    //strech line out if particleTime < travelTime, otherwise fade until fadeTime
    if(this.particleTime<=this.travelTime){
      //  print("moving!");
      stroke("rgba"+woodblockToColor.get(this.woodBlockNum)+","+this.alpha+")");
      strokeWeight(this.stroke);

      line(this.startPos[0],this.startPos[1],this.particlePos[0],this.particlePos[1]);
    }
    else{
      //print("fading!");
      stroke("rgba"+woodblockToColor.get(this.woodBlockNum)+"," +str(map(this.particleTime-this.travelTime,this.fadeTime, 0, 0,this.alpha)) +")");
      strokeWeight(map(this.particleTime-this.travelTime,this.fadeTime, 0, 0,this.stroke));
      line(this.startPos[0],this.startPos[1],this.particlePos[0],this.particlePos[1]);
    }
  }

  startPoint(){
    if(this.woodBlockNum==1 && currentTime>(67+3/16)*4 && currentTime<(69+3/4)*4 ){ //16th note woodblocks section
      if(onScreenHits2.length!=0){ //if event queue is empty return random pos
        this.angle = onScreenHits2[onScreenHits2.length-1].getAngle(); //if prev event is drum return random pos
        return onScreenHits2[onScreenHits2.length-1].getEndPos(); //otherwise, return prev end position
      }
      else{
        this.angle = random(2*PI);
        return randomPosition(windowWidth/2,windowHeight/2,(windowHeight)/2,this.angle);
      }
    }

    //usual case
    if(onScreenHits.length!=0){ //if event queue is empty return random pos
      this.angle = onScreenHits[onScreenHits.length-1].getAngle(); //if prev event is drum return random pos
      return onScreenHits[onScreenHits.length-1].getEndPos(); //otherwise, return prev end position
    }
    else{
      this.angle = random(2*PI);
      return randomPosition(windowWidth/2+random(-(windowWidth-windowHeight)/2,(windowWidth-windowHeight)/2),windowHeight/2,windowHeight/2,this.angle);
    }
  }

  endPoint() {
    var tempX,tempY;
 if(currentTime>(87)*4){ //final drum roll
   tempX = random( map(currentTime,(87)*4,(88+3/4)*4,1/3*windowWidth,0,true),map(currentTime,(87)*4,(88+3/4)*4,2/3*windowWidth,windowWidth,true) );
   //(map(currentTime,(87)*4,(88+3/4)*4,1/3,0,true))*windowWidth + (this.startPos[0] + (1/2)*(map(currentTime,(87)*4,(88+3/4)*4,1/3,1,true))*windowWidth + random([-1,1])*random((1/2)*(map(currentTime,(87)*4,(88+3/4)*4,1/3,1,true))*windowWidth)) % (windowWidth);
 }
 else{
    //get xPos(based on 1/3 width sized zones for each woodblock)
    tempX = (this.startPos[0] + (1/2)*(1/3)*windowWidth + random([-1,1])*random((1/2)*(1/3)*windowWidth)) % (windowWidth/3);
    //random(this.startPos[0]+(3/8)*(1/3)*(windowWidth),this.startPos[0]+(5/8)*(1/3)*(windowWidth))%(windowWidth/3);
    if(this.woodBlockNum == 1){
      tempX = tempX + (2/6)*windowWidth;
    }
    else if(this.woodBlockNum == 2){
      tempX = tempX + (1/6)*windowWidth;
    }
    else if(this.woodBlockNum == 3){
      tempX = tempX + (3/6)*windowWidth;
    }
    else if(this.woodBlockNum == 4){
      tempX = tempX + (0/6)*windowWidth;
    }
    else if(this.woodBlockNum == 5){
      tempX = tempX + (4/6)*windowWidth;
    }
  }

    //get y pos (switch from top/bottom of screen)
    if(this.startPos[1]>=windowHeight/2){
      tempY = 0;
    }
    else{
      tempY = windowHeight;
    }

    return [tempX,tempY];

  }

  isOffScreen(){
    return (this.particleTime>=this.travelTime+this.fadeTime);
  }

  getEndPos(){
    return this.endPos;
  }
  getAngle(){
    return this.angle;
  }
  setStartPoint(startPosArray){
    this.particlePos = [startPosArray[0],startPosArray[1]];
    this.startPos =  [startPosArray[0],startPosArray[1]];
  }
  setEndPoint(endPosArray){
    this.endPos =  [endPosArray[0],endPosArray[1]];  //get ending point
  }
  setTravelTime(time){
    this.travelTime = time; //time spent moving
  }

}

class WoodblockDouble extends Woodblock{
  constructor(){
    super(1); //doubles are always on 1st woodBlock
    this.travelTime0 = (1/16)*fr;
    this.travelTime1 = (1/16)*fr;
    this.travelTime2 = (1/8)*fr;
    this.tempStart2 = this.endPos;
    this.startPos2 = [this.tempStart2[0],this.tempStart2[1]]; //start point of 2nd woodblock
    this.particlePos2 = [this.tempStart2[0],this.tempStart2[1]];  //current pos of 2nd woodblock
    if(this.startPos2[1]>=windowHeight/2){
      this.end2_yPos = 0;
      this.end3_yPos = windowHeight;
    }
    else{
      this.end2_yPos = windowHeight;
      this.end3_yPos = 0;
    }
    this.end2_xPos = random(this.startPos[0]+1/12*(windowWidth),this.startPos[0]+1/4*(windowWidth))%(windowWidth/3) + (2/6)*windowWidth;
    this.end3_xPos = random(this.end2_xPos+1/12*(windowWidth),this.end2_xPos+1/4*(windowWidth))%(windowWidth/3) + (2/6)*windowWidth;
    this.endPos2 = [this.end2_xPos,this.end2_yPos]; //end position for 2nd woodblock
    this.startPos3 = [this.end2_xPos,this.end2_yPos];  //start point of 3rd woodblock
    this.particlePos3 = [this.end2_xPos,this.end2_yPos];  //current pos of 3rd woodblock
    this.endPos3 = [this.end3_xPos,this.end3_yPos]; //end position for 3rd woodblock
    this.sixteenthLength = fr*(1/4)*(tempo/60); //number of frames in 1/16th note
  }

  update(){
    //  print("woodblock update")
    this.particleTime++;

    if(this.particleTime<(1/2)*this.sixteenthLength){
    //  print("update stage 0");
    }
    else if(this.particleTime>(1/2)*this.sixteenthLength && this.particleTime<(3/4)*this.sixteenthLength){ //first line grows
    //  print("update stage 1");
      this.particlePos[0]+= (1/this.travelTime0)*(this.endPos[0]-this.startPos[0]);
      this.particlePos[1]+= (1/this.travelTime0)*(this.endPos[1]-this.startPos[1]);
    }
    else if(this.particleTime>(3/4)*this.sixteenthLength && this.particleTime<this.sixteenthLength){ //second line grows
    //  print("update stage 2");
      this.particlePos2[0]+= (1/this.travelTime1)*(this.endPos2[0]-this.startPos2[0]);
      this.particlePos2[1]+= (1/this.travelTime1)*(this.endPos2[1]-this.startPos2[1]);
    }
    else if(this.particleTime>this.sixteenthLength && this.particleTime<this.sixteenthLength+this.travelTime2){ //
    //  print("update stage 3");
      this.particlePos3[0]+= (1/this.travelTime2)*(this.endPos3[0]-this.startPos3[0]);
      this.particlePos3[1]+= (1/this.travelTime2)*(this.endPos3[1]-this.startPos3[1]);
    }
  }

  display(){
    if(this.particleTime<(1/2)*this.sixteenthLength){
    //  print("display stage 0");
    }
    else if(this.particleTime>(1/2)*this.sixteenthLength && this.particleTime<(3/4)*this.sixteenthLength){ //first line grows
  //    print("display stage 1");
      stroke("rgb"+woodblockToColor.get(this.woodBlockNum)+")");
      strokeWeight(64);
      line(this.startPos[0],this.startPos[1],this.particlePos[0],this.particlePos[1]);
    }
    else if(this.particleTime>(3/4)*this.sixteenthLength && this.particleTime<this.sixteenthLength){ //second line grows, first line fades
  //    print("display stage 2");
      //first line (fading)
      stroke("rgba"+woodblockToColor.get(this.woodBlockNum)+"," +str(map(this.particleTime-(3/4)*this.sixteenthLength,this.fadeTime, 0, 0,1,true)) +")");
      strokeWeight(map(this.particleTime-(3/4)*this.sixteenthLength,this.fadeTime, 0, 0,64,true));
      line(this.startPos[0],this.startPos[1],this.particlePos[0],this.particlePos[1]);
      //second line (growing)
      stroke("rgb"+woodblockToColor.get(this.woodBlockNum)+")");  //second line growing
      strokeWeight(64);
      line(this.startPos2[0],this.startPos2[1],this.particlePos2[0],this.particlePos2[1]);

    }
     else if(this.particleTime>this.sixteenthLength && this.particleTime<this.sixteenthLength+this.travelTime2){ //third line is growing (other two fade)
  //     print("display stage 3");
      //first line (fading)
      stroke("rgba"+woodblockToColor.get(this.woodBlockNum)+"," +str(map(this.particleTime-(3/4)*this.sixteenthLength,this.fadeTime, 0, 0,1,true)) +")");
      strokeWeight(map(this.particleTime-(3/4)*this.sixteenthLength,this.fadeTime, 0, 0,64,true));
      line(this.startPos[0],this.startPos[1],this.particlePos[0],this.particlePos[1]);
    //second line (fading)
      stroke("rgba"+woodblockToColor.get(this.woodBlockNum)+"," +str(map(this.particleTime-this.sixteenthLength,this.fadeTime, 0, 0,1,true)) +")");
      strokeWeight(map(this.particleTime-this.sixteenthLength,this.fadeTime, 0, 0,64,true));
      line(this.startPos2[0],this.startPos2[1],this.particlePos2[0],this.particlePos2[1]);
    //third line (growing)
      stroke("rgb"+woodblockToColor.get(this.woodBlockNum)+")");  //second line growing
      strokeWeight(64);
      line(this.startPos3[0],this.startPos3[1],this.particlePos3[0],this.particlePos3[1]);
     }
    else if(this.particleTime>this.sixteenthLength+this.travelTime2){
    //  print("display stage 4");
      //first line (fading)
      stroke("rgba"+woodblockToColor.get(this.woodBlockNum)+"," +str(map(this.particleTime-(3/4)*this.sixteenthLength,this.fadeTime, 0, 0,1,true)) +")");
      strokeWeight(map(this.particleTime-(3/4)*this.sixteenthLength,this.fadeTime, 0, 0,64,true));
      line(this.startPos[0],this.startPos[1],this.particlePos[0],this.particlePos[1]);
    //second line (fading)
      stroke("rgba"+woodblockToColor.get(this.woodBlockNum)+"," +str(map(this.particleTime-this.sixteenthLength,this.fadeTime, 0, 0,1,true)) +")");
      strokeWeight(map(this.particleTime-this.sixteenthLength,this.fadeTime, 0, 0,64));
      line(this.startPos2[0],this.startPos2[1],this.particlePos2[0],this.particlePos2[1]);
      //third line (fading)
      stroke("rgba"+woodblockToColor.get(this.woodBlockNum)+"," +str(map(this.particleTime-this.sixteenthLength+this.travelTime2,this.fadeTime, 0, 0,1,true)) +")");
      strokeWeight(map(this.particleTime-this.sixteenthLength+this.travelTime2,this.fadeTime, 0, 0,64));
      line(this.startPos3[0],this.startPos3[1],this.particlePos3[0],this.particlePos3[1]);
     }
  }
  getEndPos(){
    return this.endPos3;
  }
  isOffScreen(){
    return (this.particleTime>=this.sixteenthLength+this.travelTime2+this.fadeTime);
  }
}


var randXPos, randYpos;
function randomPosition(xPos,yPos,radius,theta){
  randXpos =  xPos + radius*cos(theta);
  randYpos =  yPos + radius*sin(theta);
  return [randXpos, randYpos];
}

//function to handle pausing/jumping audio time
let jumpTime = 4*(30); //jump audio to this time (in seconds)
// function keyPressed() {
//
//   if (audio.isPlaying()) {
//     audio.pause();
//   } else {
//     audio.play();
//   }
//
//   // if(key  === 'j'){  //press j to jump to specific time
//   //   if (audio.isPlaying()) {
//   //     audio.pause();
//   //     onScreenHits.splice(0,onScreenHits.length);
//   //   } else {
//   //     audio.play();
//   //     audio.jump(jumpTime, audio.duration()-jumpTime);
//   //   }
//   // }
//   // if(key === ' '){ //press space to play/pause
//   //   if (audio.isPlaying()) {
//   //     audio.pause();
//   //   } else {
//   //     audio.play();
//   //   }
//   // }
//   // if(key  === 'b'){
//   //   if (audio.isPlaying()) {
//   //     audio.pause();
//   //   } else {
//   //     audio.play();
//   //     audio.jump(audio.currentTime()-4);
//   //   }
//   // }
//   // if(key === 'w'){
//   //   onScreenHits2.push(new WoodblockDouble());
//   // }
//
// }

function mouseClicked(){
    if (audio.isPlaying()) {
      audio.pause();
    } else {
      audio.play();
    }
}


function draw() {
  background(0);
  //time from song start (not counting opening silence)
  currentTime = audio.currentTime()-(4);
  // fill(155);
  // textSize(32);
  // strokeWeight(1);
  // text(currentTime/4 +1,00,30);

 if(!audio.isPlaying()){
   title.style('font-size', '10vh');
   title.style('width', '100vw');
   title.style('text-align', 'center');
   title.style('color', 'rgba(255,255,255,1)');
   title.position(0,2.5*height/10);
   subtitle.style('font-size', '10vh');
   subtitle.style('width', '100vw');
   subtitle.style('text-align', 'center');
   subtitle.style('color', 'rgba(255,255,255,1)');
   subtitle.position(0,4.5*height/10);
   subtitle2.style('font-size', '6vh');
   subtitle2.style('width', '100vw');
   subtitle2.style('text-align', 'center');
   subtitle2.style('color', 'rgba(255,255,255,1)');
   subtitle2.position(0,6.5*height/10);
 }
 else if(currentTime>-4 && currentTime<-1){
   subtitle2.html("STARTING");
   title.style('color',  'rgba(255,255,255,'+map(currentTime,-4,-1,1,0,)+')');
   subtitle.style('color', 'rgba(255,255,255,'+map(currentTime,-4,-1,1,0,)+')');
   subtitle2.style('color', 'rgba(255,255,255,'+map(currentTime,-4,-1,1,0,)+')');
 }
 else if (currentTime>-1 && audio.isPlaying()){
     title.remove();
     subtitle.remove();
     subtitle2.remove();
    if(currentTime<=4){//measure 1
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum3())
        beatToggle = true;
      }
      else if(currentTime%4 >= -1/16*4 && currentTime%4 < 0/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
    }
    else if(currentTime<=8){//measure 2
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        // print("beat 15");
        // print(currentTime);
        onScreenHits.push(new HiHat());

        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        // print("beat 14");
        // print(currentTime);
        onScreenHits.push(new HiHat());

        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        // print("beat 13");
        // print(currentTime);
        onScreenHits.push(new Drum4())
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        // print("beat 12");
        // print(currentTime);
        onScreenHits.push(new Drum5())
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        // print("beat 11");
        // print(currentTime);
        onScreenHits.push(new HiHat());

        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        // print("beat 10");
        // print(currentTime);
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        // print("beat 9");
        print(currentTime);

        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        //      print("beat 8");
        print(currentTime);
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        //        print("beat 7");
        print(currentTime);
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        //      print("beat 6");
        print(currentTime);
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        //        print("beat 5");
        print(currentTime);
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        //        print("beat 4");
        print(currentTime);
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        //      print("beat 3");
        print(currentTime);
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        //        print("beat 2");
        print(currentTime);
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        //          print("beat 1");
        print(currentTime);
        beatToggle = true;
      }
    }
    else if(currentTime<=12){//measure 3
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum5());

        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        beatToggle = true;
      }
    }
    else if(currentTime<=16){//measure 4
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        beatToggle = true;
        onScreenHits.push(new Drum4());
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        beatToggle = true;
        onScreenHits.push(new Drum5());
      }
    }
    else if(currentTime<=20){//measure 5
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        onScreenHits.push(new Drum4());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = true;
      }
    }
    else if(currentTime<=24){//measure 6
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        onScreenHits.push(new Drum3());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        beatToggle = true;
      }
    }
    else if(currentTime<=28){//measure 7
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new Snare());

        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=32){//measure 8
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=36){//measure 9
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = true;
      }
    }
    else if(currentTime<=40){//measure 10
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
    }
    else if(currentTime<=44){//measure 11
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        beatToggle = true;
        onScreenHits.push(new Snare());
      }
    }
    else if(currentTime<=48){//measure 12
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        beatToggle = true;
      }
    }
    else if(currentTime<=4*13){//measure 13
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*14){//measure 14
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*15){//measure 15
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*16){//measure 16
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*17){//measure 17
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());

        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*18){//measure 18
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*19){//measure 19
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum5())
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum4())
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        beatToggle = true;
      }
    }
    else if(currentTime<=4*20){//measure 20
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*21){//measure 21
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*22){//measure 22
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHatDouble());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*23){//measure 23
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*24){//measure 24
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){

        beatToggle = true;
      }
    }
    else if(currentTime<=4*25){//measure 25
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){

        beatToggle = true;
      }
    }
    else if(currentTime<=4*26){//measure 26
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*27){//measure 27
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Snare());

        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*28){//measure 28
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*29){//measure 29
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*30){ //measure 30
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && !beatToggle){
        onScreenHits.push(new Woodblock(4));
        beatToggle=true;
      }
      if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && beatToggle){
        onScreenHits.push(new Woodblock(5));
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*31){ //measure 31
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && beatCount == 31){
        print("beat 31");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && beatCount == 30){
        print("beat 30");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(4));
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4 && beatCount == 29){
        print("beat 29");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(2));
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4 && beatCount == 28){
        print("beat 28");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4 && beatCount == 27){
        print("beat 27");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4 && beatCount == 26){
        print("beat 26");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4 && beatCount == 25){
        print("beat 25");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(3));
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4 && beatCount == 24){
        print("beat 24");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));

        beatCount++;
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4 && beatCount == 23){
        print("beat 23");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(4));

        beatCount++;
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4 && beatCount == 22){
        print("beat 22");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(2));

        beatCount++;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4 && beatCount == 21){
        print("beat 21");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));

        beatCount++;
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4 && beatCount == 20){
        print("beat 20");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));

        beatCount++;
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4 && beatCount == 19){
        print("beat 19");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));

        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && beatCount == 18){
        print("beat 18");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));

        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && beatCount == 17){
        print("beat 17");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(3));

        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4 && beatCount == 16){
        print("beat 16");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));

        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4 && beatCount == 15){
        print("beat 15");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(4));
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4 && beatCount == 14){
        print("beat 14");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(2));
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4 && beatCount == 13){
        print("beat 13");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4 && beatCount == 12){
        print("beat 12");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4 && beatCount == 11){
        print("beat 11");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4 && beatCount == 10){
        print("beat 10");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(4));
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4 && beatCount == 9){
        print("beat 9");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4 && beatCount == 8){
        print("beat 8");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(3));

        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4 && beatCount == 7){
        print("beat 7");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(2));

        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4 && beatCount == 6){
        print("beat 6");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));

        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4 && beatCount == 5){
        print("beat 5");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));

        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4 && beatCount == 4){
        print("beat 4");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));

        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4 && beatCount == 3){
        print("beat 3");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));

        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4 && beatCount == 2){
        print("beat 2");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(3));

        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4 && beatCount == 1){
        print("beat 1");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));

        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && beatCount==0){
        print("beat 0");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(4));

        beatCount++;
      }
    }
    else if(currentTime<=4*32){ //measure 32
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && beatCount == 31){
        print("beat 31");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && beatCount == 30){
        print("beat 30");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4 && beatCount == 29){
        print("beat 29");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4 && beatCount == 28){
        print("beat 28");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(3));
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4 && beatCount == 27){
        print("beat 27");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4 && beatCount == 26){
        print("beat 26");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(4));
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4 && beatCount == 25){
        print("beat 25");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(2));
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4 && beatCount == 24){
        print("beat 24");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(2));

        beatCount++;
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4 && beatCount == 23){
        print("beat 23");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(2));

        beatCount++;
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4 && beatCount == 22){
        print("beat 22");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(2));

        beatCount++;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4 && beatCount == 21){
        print("beat 21");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));

        beatCount++;
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4 && beatCount == 20){
        print("beat 20");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));

        beatCount++;
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4 && beatCount == 19){
        print("beat 19");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(3));

        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && beatCount == 18){
        print("beat 18");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));

        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && beatCount == 17){
        print("beat 17");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(4));

        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4 && beatCount == 16){
        print("beat 16");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(4));

        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4 && beatCount == 15){
        print("beat 15");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(4));
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4 && beatCount == 14){
        print("beat 14");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(2));
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4 && beatCount == 13){
        print("beat 13");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4 && beatCount == 12){
        print("beat 12");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4 && beatCount == 11){
        print("beat 11");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4 && beatCount == 10){
        print("beat 10");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4 && beatCount == 9){
        print("beat 9");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(3));
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4 && beatCount == 8){
        print("beat 8");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));

        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4 && beatCount == 7){
        print("beat 7");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(4));

        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4 && beatCount == 6){
        print("beat 6");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(2));

        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4 && beatCount == 5){
        print("beat 5");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));

        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4 && beatCount == 4){
        print("beat 4");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(1));

        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4 && beatCount == 3){
        print("beat 3");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(5));

        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4 && beatCount == 2){
        print("beat 2");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(3));

        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4 && beatCount == 1){
        print("beat 1");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(3));

        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && beatCount==0){
        print("beat 0");
        print(currentTime%4);
        onScreenHits.push(new Woodblock(3));

        beatCount++;
      }
    }
    else if(currentTime<=4*33){ //measure 33
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 31){
        onScreenHits.push(new Woodblock(4));
        beatToggle=true;
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && beatToggle && beatCount == 30){
        onScreenHits.push(new Woodblock(4));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4 && !beatToggle && beatCount == 29){
        onScreenHits.push(new Woodblock(4));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4 && beatToggle && beatCount == 28){
        onScreenHits.push(new Woodblock(4));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4 && !beatToggle && beatCount == 27){
        onScreenHits.push(new Woodblock(2));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4 && beatToggle && beatCount == 26){
        onScreenHits.push(new Woodblock(1));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4 && !beatToggle && beatCount == 25){
        onScreenHits.push(new Woodblock(3));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4 && beatToggle && beatCount == 24){
        onScreenHits.push(new Woodblock(5));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4 && !beatToggle && beatCount == 23){
        onScreenHits.push(new Woodblock(5));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4 && beatToggle && beatCount == 22){
        onScreenHits.push(new Woodblock(4));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4 && !beatToggle && beatCount == 21){
        onScreenHits.push(new Woodblock(2));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4 && beatToggle && beatCount == 20){
        onScreenHits.push(new Woodblock(1));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4 && !beatToggle && beatCount == 19){
        onScreenHits.push(new Woodblock(1));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && beatToggle && beatCount == 18){
        onScreenHits.push(new Woodblock(5));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && !beatToggle && beatCount == 17){
        onScreenHits.push(new Woodblock(5));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4 && beatToggle && beatCount == 16){
        onScreenHits.push(new Woodblock(3));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 15){
        onScreenHits.push(new Woodblock(5));
        beatToggle=true;
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4 && beatToggle && beatCount == 14){
        onScreenHits.push(new Woodblock(4));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4 && !beatToggle && beatCount == 13){
        onScreenHits.push(new Woodblock(4));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4 && beatToggle && beatCount == 12){
        onScreenHits.push(new Woodblock(4));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4 && !beatToggle && beatCount == 11){
        onScreenHits.push(new Woodblock(2));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4 && beatToggle && beatCount == 10){
        onScreenHits.push(new Woodblock(1));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4 && !beatToggle && beatCount == 9){
        onScreenHits.push(new Woodblock(5));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4 && beatToggle && beatCount == 8){
        onScreenHits.push(new Woodblock(3));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4 && !beatToggle && beatCount == 7){
        onScreenHits.push(new Woodblock(3));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4 && beatToggle && beatCount == 6){
        onScreenHits.push(new Woodblock(3));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4 && !beatToggle && beatCount == 5){
        onScreenHits.push(new Woodblock(5));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4 && beatToggle && beatCount == 4){
        onScreenHits.push(new Woodblock(4));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4 && !beatToggle && beatCount == 3){
        onScreenHits.push(new Woodblock(2));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4 && beatToggle && beatCount == 2){
        onScreenHits.push(new Woodblock(2));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4 && !beatToggle && beatCount == 1){
        onScreenHits.push(new Woodblock(1));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && beatToggle && beatCount==0){
        onScreenHits.push(new Woodblock(1));
        beatToggle = false;
        beatCount++;
      }
    }
    else if(currentTime<=4*34){ //measure 34
      if(currentTime%4 >= 13/16*4 && currentTime%4 < 16/16*4){
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 13/16*4){
        onScreenHits.push(new Drum1());
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 9/16*4 && frameCount%2==0){
        onScreenHits.push(new Drum1());
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle && beatCount==0){
        onScreenHits.push(new Woodblock(1));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4 && !beatToggle && beatCount == 1){
        onScreenHits.push(new Woodblock(3));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && beatToggle && beatCount==0){
        onScreenHits.push(new Woodblock(5));
        beatToggle = false;
        beatCount++;
      }
    }
    else if(currentTime<=4*35){//measure 35
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 3/16*4 && beatToggle){
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
        onScreenHits.push(new Drum1());
      }

    }
    else if(currentTime<=4*36){//measure 36
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*37){//measure 37
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new Drum3());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*38){//measure 38
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*39){//measure 39
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new Drum4());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*40){//measure 40
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*41){//measure 41
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){

        beatToggle = true;
      }
    }
    else if(currentTime<=4*42){//measure 42
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){

        beatToggle = true;
      }
    }
    else if(currentTime<=4*43){
      //measure 43
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 31){
        onScreenHits.push(new Drum1());
        beatToggle=true;
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && beatToggle && beatCount == 30){
        onScreenHits.push(new Drum3());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4 && !beatToggle && beatCount == 29){
        onScreenHits.push(new Drum2());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4 && beatToggle && beatCount == 28){
        onScreenHits.push(new Drum4());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4 && !beatToggle && beatCount == 27){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4 && beatToggle && beatCount == 26){
        onScreenHits.push(new Drum1());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatCount = 26;
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        beatToggle = true;
      }
    }
    else if(currentTime<=4*44){ //measure 44
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 31){
        onScreenHits.push(new Drum3());
        beatToggle=true;
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && beatToggle && beatCount == 30){
        onScreenHits.push(new Drum1());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4 && !beatToggle && beatCount == 29){
        onScreenHits.push(new Drum1());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4 && beatToggle && beatCount == 28){
        onScreenHits.push(new Drum2());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4 && !beatToggle && beatCount == 27){
        onScreenHits.push(new Drum1());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4 && beatToggle && beatCount == 26){
        onScreenHits.push(new Drum3());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4 && !beatToggle && beatCount == 25){
        onScreenHits.push(new Drum4());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4 && beatToggle && beatCount == 24){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4 && !beatToggle && beatCount == 23){
        onScreenHits.push(new Drum2());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4 && beatToggle && beatCount == 22){
        onScreenHits.push(new Drum1());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4 && !beatToggle && beatCount == 21){
        onScreenHits.push(new Drum2());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4 && beatToggle && beatCount == 20){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4 && !beatToggle && beatCount == 19){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && beatToggle && beatCount == 18){
        onScreenHits.push(new Drum4());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && !beatToggle && beatCount == 17){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4 && beatToggle && beatCount == 16){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 15){
        onScreenHits.push(new Drum1());
        beatToggle=true;
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4 && beatToggle && beatCount == 14){
        onScreenHits.push(new Drum3());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4 && !beatToggle && beatCount == 13){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4 && beatToggle && beatCount == 12){
        onScreenHits.push(new Drum4());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4 && !beatToggle && beatCount == 11){
        onScreenHits.push(new Drum2());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4 && beatToggle && beatCount == 10){
        onScreenHits.push(new Drum1());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4 && !beatToggle && beatCount == 9){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4 && beatToggle && beatCount == 8){
        onScreenHits.push(new Drum4());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4 && !beatToggle && beatCount == 7){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4 && beatToggle && beatCount == 6){
        onScreenHits.push(new Drum3());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4 && !beatToggle && beatCount == 5){
        onScreenHits.push(new Drum2());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4 && beatToggle && beatCount == 4){
        onScreenHits.push(new Drum1());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4 && !beatToggle && beatCount == 3){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4 && beatToggle && beatCount == 2){
        onScreenHits.push(new Drum2());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4 && !beatToggle && beatCount == 1){
        onScreenHits.push(new Drum4());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && beatToggle && beatCount==0){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
    }
    else if(currentTime<=4*45){ //measure 45
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 31){
        onScreenHits.push(new Drum5());
        beatToggle=true;
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && beatToggle && beatCount == 30){
        onScreenHits.push(new Drum4());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4 && !beatToggle && beatCount == 29){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4 && beatToggle && beatCount == 28){
        onScreenHits.push(new Drum2());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4 && !beatToggle && beatCount == 27){
        onScreenHits.push(new Drum1());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4 && beatToggle && beatCount == 26){
        onScreenHits.push(new Drum5());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4 && !beatToggle && beatCount == 25){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4 && beatToggle && beatCount == 24){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4 && !beatToggle && beatCount == 23){
        onScreenHits.push(new Drum4());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4 && beatToggle && beatCount == 22){
        onScreenHits.push(new Drum1());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4 && !beatToggle && beatCount == 21){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4 && beatToggle && beatCount == 20){
        onScreenHits.push(new Drum3());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4 && !beatToggle && beatCount == 19){
        onScreenHits.push(new Drum2());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && beatToggle && beatCount == 18){
        onScreenHits.push(new Drum1());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && !beatToggle && beatCount == 17){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4 && beatToggle && beatCount == 16){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 15){
        onScreenHits.push(new Drum1());
        beatToggle=true;
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4 && beatToggle && beatCount == 14){
        onScreenHits.push(new Drum2());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4 && !beatToggle && beatCount == 13){
        onScreenHits.push(new Drum2());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4 && beatToggle && beatCount == 12){
        onScreenHits.push(new Drum5());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4 && !beatToggle && beatCount == 11){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4 && beatToggle && beatCount == 10){
        onScreenHits.push(new Drum5());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4 && !beatToggle && beatCount == 9){
        onScreenHits.push(new Drum1());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4 && beatToggle && beatCount == 8){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4 && !beatToggle && beatCount == 7){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4 && beatToggle && beatCount == 6){
        onScreenHits.push(new Drum2());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4 && !beatToggle && beatCount == 5){
        onScreenHits.push(new Drum4());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4 && beatToggle && beatCount == 4){
        onScreenHits.push(new Drum3());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4 && !beatToggle && beatCount == 3){
        onScreenHits.push(new Drum4());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4 && beatToggle && beatCount == 2){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4 && !beatToggle && beatCount == 1){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && beatToggle && beatCount==0){
        onScreenHits.push(new Drum4());
        beatToggle = false;
        beatCount++;
      }
    }
    else if(currentTime<=4*46){
      //measure 46
      if(currentTime%4 >= 3/4*4 && currentTime%4 < 4/4*4){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4 && !beatToggle && beatCount == 23){
        beatToggle = true;
        beatCount=0;
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4 && beatToggle && beatCount == 22){
        onScreenHits.push(new Drum1());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4 && !beatToggle && beatCount == 21){
        onScreenHits.push(new Drum1());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4 && beatToggle && beatCount == 20){
        onScreenHits.push(new Drum1());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4 && !beatToggle && beatCount == 19){
        onScreenHits.push(new Drum1());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && beatToggle && beatCount == 18){
        onScreenHits.push(new Drum1());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && !beatToggle && beatCount == 17){
        onScreenHits.push(new Drum1());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4 && beatToggle && beatCount == 16){
        onScreenHits.push(new Drum2());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 15){
        onScreenHits.push(new Drum3());
        beatToggle=true;
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4 && beatToggle && beatCount == 14){
        onScreenHits.push(new Drum4());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4 && !beatToggle && beatCount == 13){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4 && beatToggle && beatCount == 12){
        onScreenHits.push(new Drum2());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4 && !beatToggle && beatCount == 11){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4 && beatToggle && beatCount == 10){
        onScreenHits.push(new Drum4());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4 && !beatToggle && beatCount == 9){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4 && beatToggle && beatCount == 8){
        onScreenHits.push(new Drum2());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4 && !beatToggle && beatCount == 7){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4 && beatToggle && beatCount == 6){
        onScreenHits.push(new Drum2());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4 && !beatToggle && beatCount == 5){
        onScreenHits.push(new Drum4());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4 && beatToggle && beatCount == 4){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4 && !beatToggle && beatCount == 3){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4 && beatToggle && beatCount == 2){
        onScreenHits.push(new Drum1());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4 && !beatToggle && beatCount == 1){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && beatToggle && beatCount==0){
        onScreenHits.push(new Drum4());
        beatToggle = false;
        beatCount++;
      }
    }
    else if(currentTime<=4*47){ //measure 47
      if(currentTime%4 >= 7/8*4 && currentTime%4 < 8/8*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = true;
      }
      else if(currentTime%4 >= 0/8*4 && currentTime%4 < 7/8*4){
        onScreenHits.push(new Drum5());
      }
    }
    else if(currentTime<=4*48){//measure 48
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
      else if(currentTime%4 >= 0/4*4 && currentTime%4 < 1/4*4 && beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = false;
      }
    }
    else if(currentTime<=4*49){//measure 49
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new Drum5());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        beatToggle = true;
      }
    }
    else if(currentTime<=4*50){//measure 50
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*51){//measure 51
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());

        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new Drum4());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*52){//measure 52
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*53){//measure 53
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatfffDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){

        beatToggle = true;
      }
    }
    else if(currentTime<=4*54){//measure 54
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(2));
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(5));
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(3));
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(3));
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(5));
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(5));
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(2));
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(5));
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(3));
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new DrumBurst(2));
        beatToggle = true;
      }
    }
    else if(currentTime<=4*55){//measure 55
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(5));
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(2));
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(3));
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(5));
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(2));
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(5));
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(3));
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(2));
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(5));
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(2));
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(3));
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle = true;
      }
    }
    else if(currentTime<=4*56){//measure 56
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 31){
        onScreenHits.push(new Drum5());
        beatToggle=true;
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && beatToggle && beatCount == 30){
        onScreenHits.push(new Drum2());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4 && !beatToggle && beatCount == 29){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4 && beatToggle && beatCount == 28){
        onScreenHits.push(new Drum5());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4 && !beatToggle && beatCount == 27){
        onScreenHits.push(new Drum2());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4 && beatToggle && beatCount == 26){
        onScreenHits.push(new Drum4());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4 && !beatToggle && beatCount == 25){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4 && beatToggle && beatCount == 24){
        onScreenHits.push(new Drum2());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4 && !beatToggle && beatCount == 23){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4 && beatToggle && beatCount == 22){
        onScreenHits.push(new Drum2());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4 && !beatToggle && beatCount == 21){
        onScreenHits.push(new Drum4());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4 && beatToggle && beatCount == 20){
        onScreenHits.push(new Drum3());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4 && !beatToggle && beatCount == 19){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && beatToggle && beatCount == 18){
        onScreenHits.push(new Drum2());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && !beatToggle && beatCount == 17){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4 && beatToggle && beatCount == 16){
        onScreenHits.push(new Drum3());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 15){
        onScreenHits.push(new Drum4());
        beatToggle=true;
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4 && beatToggle && beatCount == 14){
        onScreenHits.push(new Drum5());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(2));
        beatToggle = true;
        beatCount = 14;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(3));
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(2));
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(5));
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(3));
        beatToggle = true;
      }
    }
    else if(currentTime<=4*57){ //measure 57
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum2());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum2());
        beatToggle=true;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && beatToggle && beatCount == 18){
        onScreenHits.push(new Drum2());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && !beatToggle && beatCount == 17){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4 && beatToggle && beatCount == 16){
        onScreenHits.push(new Drum3());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 15){
        onScreenHits.push(new Drum4());
        beatToggle=true;
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4 && beatToggle && beatCount == 14){
        onScreenHits.push(new Drum2());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4 && !beatToggle && beatCount == 13){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4 && beatToggle && beatCount == 12){
        onScreenHits.push(new Drum4());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4 && !beatToggle && beatCount == 11){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4 && beatToggle && beatCount == 10){
        onScreenHits.push(new Drum2());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4 && !beatToggle && beatCount == 9){
        onScreenHits.push(new Drum5());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4 && beatToggle && beatCount == 8){
        onScreenHits.push(new Drum4());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4 && !beatToggle && beatCount == 7){
        onScreenHits.push(new Drum2());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4 && beatToggle && beatCount == 6){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4 && !beatToggle && beatCount == 5){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4 && beatToggle && beatCount == 4){
        onScreenHits.push(new Drum4());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4 && !beatToggle && beatCount == 3){
        onScreenHits.push(new Drum2());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4 && beatToggle && beatCount == 2){
        onScreenHits.push(new Drum5());
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4 && !beatToggle && beatCount == 1){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && beatToggle && beatCount==0){
        onScreenHits.push(new Drum4());
        beatToggle = false;
        beatCount++;
      }
    }
    else if(currentTime<=4*58){//measure 58
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum2());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Drum2());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new DrumBurst(5));
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new DrumBurst(4));
        beatToggle = true;
      }
    }
    else if(currentTime<=4*59){//measure 59
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum4 ());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHatAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*60){//measure 60
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){

        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble ());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHatDoubleAccent());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHatDoubleAccent());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*61){//measure 61
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Drum3Double());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new SnareDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new Drum3());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*62){//measure 62
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){

        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new Drum5Double());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new Drum4Double());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        onScreenHits.push(new Drum5Double());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new Drum4Double());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new SnareDouble());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*63){//measure 63
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new SnareDouble());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new Drum5Double());
        onScreenHits.push(new HiHat());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new Drum4Double());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){

        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum3Double());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){

        beatToggle = true;
      }
    }
    else if(currentTime<=4*64){//measure 64
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits.push(new Drum3Double());
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits.push(new SnareDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits.push(new Drum5Double());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDoubleAccent());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Drum3Double());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits.push(new SnareDouble());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum4Double());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new Drum5Double());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHatDouble());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum3Double());
        onScreenHits.push(new HiHat());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){

        beatToggle = true;
      }
    }
    else if(currentTime<=4*65){
      //measure 65
      if(currentTime%4 >= 7/8*4 && currentTime%4 < 8/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 5/8*4 && currentTime%4 < 7/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 3/8*4 && currentTime%4 < 5/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 2/8*4 && currentTime%4 < 3/8*4 && frameCount%4==0){
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits.push(new HiHat());
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new Drum4Double());
        onScreenHits.push(new HiHat());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new Drum5Double());
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*66){
      //measure 66
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 3/8*4 && currentTime%4 < 5/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 1/8*4 && currentTime%4 < 3/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 0/8*4 && currentTime%4 < 1/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
    }
    else if(currentTime<=4*67){//measure 67
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
    }
    else if(currentTime<=4*68){//measure 68
      //woddblock roll if-statements
      if(currentTime%4 >= 12/16*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 12/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 10/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 7/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      //metronomic woodblock if-statements
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = false;
      }
    }
    else if(currentTime<=4*69){//measure 69
      //woodblock roll if-statements
      if(currentTime%4 >= 10/16*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 9/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 6/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 2/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }

      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && beatToggle){
        beatToggle=false;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = false;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && !beatToggle){
        beatToggle=true;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*70){//measure 70
      //woodblock roll if-statements
      if(currentTime%4 >= 8/16*4 && currentTime%4 < 12/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 8/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 6/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 2/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }

      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 31){
        onScreenHits.push(new Woodblock(2));
        beatToggle=true;
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && beatToggle && beatCount == 30){
        onScreenHits.push(new Woodblock(5));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4 && !beatToggle && beatCount == 29){
        onScreenHits.push(new Woodblock(3));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4 && beatToggle && beatCount == 28){
        onScreenHits.push(new Woodblock(5));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4 && !beatToggle && beatCount == 27){
        onScreenHits.push(new Woodblock(4));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4 && beatToggle && beatCount == 26){
        onScreenHits.push(new Woodblock(1));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4 && !beatToggle && beatCount == 25){
        onScreenHits.push(new Woodblock(2));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4 && beatToggle && beatCount == 24){
        onScreenHits.push(new Woodblock(3));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4 && !beatToggle && beatCount == 23){
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 23/32*4 && beatToggle){
        beatToggle = false;
        beatCount = 23;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle=true;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        beatToggle = false;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits2.push(new Woodblock(1));
        onScreenHits2.push(new WoodblockDouble());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*71){ //measure 71
      if(currentTime%4 >= 7/8*4 && currentTime%4 < 8/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 5/8*4 && currentTime%4 < 7/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4 && !beatToggle && beatCount == 19){
        onScreenHits.push(new Woodblock(1));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && beatToggle && beatCount == 18){
        onScreenHits.push(new Woodblock(1));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && !beatToggle && beatCount == 17){
        onScreenHits.push(new Woodblock(1));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4 && beatToggle && beatCount == 16){
        onScreenHits.push(new Woodblock(4));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 15){
        onScreenHits.push(new Woodblock(3));
        beatToggle=true;
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4 && beatToggle && beatCount == 14){
        onScreenHits.push(new Woodblock(3));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4 && !beatToggle && beatCount == 13){
        onScreenHits.push(new Woodblock(5));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4 && beatToggle && beatCount == 12){
        onScreenHits.push(new Woodblock(5));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4 && !beatToggle && beatCount == 11){
        onScreenHits.push(new Woodblock(1));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4 && beatToggle && beatCount == 10){
        onScreenHits.push(new Woodblock(4));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4 && !beatToggle && beatCount == 9){
        onScreenHits.push(new Woodblock(4));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4 && beatToggle && beatCount == 8){
        onScreenHits.push(new Woodblock(4));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4 && !beatToggle && beatCount == 7){
        onScreenHits.push(new Woodblock(2));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4 && beatToggle && beatCount == 6){
        onScreenHits.push(new Woodblock(2));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4 && !beatToggle && beatCount == 5){
        onScreenHits.push(new Woodblock(5));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4 && beatToggle && beatCount == 4){
        onScreenHits.push(new Woodblock(5));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4 && !beatToggle && beatCount == 3){
        onScreenHits.push(new Woodblock(5));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4 && beatToggle && beatCount == 2){
        onScreenHits.push(new Woodblock(5));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4 && !beatToggle && beatCount == 1){
        onScreenHits.push(new Woodblock(1));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && beatToggle && beatCount==0){
        onScreenHits.push(new Woodblock(5));
        beatToggle = false;
        beatCount++;
      }
    }
    else if(currentTime<=4*72){ //measure 72
      if(currentTime%4 >= 7/8*4 && currentTime%4 < 8/8*4 && frameCount%4==0){
        onScreenHits.push(new Drum1());
      }
      else if(currentTime%4 >= 0/8*4 && currentTime%4 < 7/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }

    }
    else if(currentTime<=4*73){ //measure 73
      if(currentTime%4 >= 7/8*4 && currentTime%4 < 8/8*4 && frameCount%4==0){
        onScreenHits.push(new Drum4());
      }
      else if(currentTime%4 >= 3/8*4 && currentTime%4 < 7/8*4 && frameCount%4==0){
        onScreenHits.push(new Drum3());
      }
      else if(currentTime%4 >= 0/8*4 && currentTime%4 < 3/8*4 && frameCount%4==0){
        onScreenHits.push(new Drum2());
      }

    }
    else if(currentTime<=4*74){
      //measure 73
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && !beatToggle && beatCount == 31){
        onScreenHits.push(new Woodblock(1));
        beatToggle=true;
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && beatToggle && beatCount == 30){
        onScreenHits.push(new Drum4());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4 && !beatToggle && beatCount == 29){
        onScreenHits.push(new Woodblock(5));
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4 && beatToggle && beatCount == 28){
        onScreenHits.push(new Drum5());
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4 && !beatToggle && beatCount == 27){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4 && beatToggle && beatCount == 26){
        onScreenHits.push(new Woodblock(3));
        beatToggle=false;
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4 && !beatToggle && beatCount == 25){
        onScreenHits.push(new Snare());
        beatToggle = true;
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4 && beatToggle && beatCount == 24){
        onScreenHits.push(new Woodblock(1));
        beatToggle = false;
        beatCount++;
      }
      else if(currentTime%4 >= 3/8*4 && currentTime%4 < 6/8*4 && frameCount%4==0){
        onScreenHits.push(new Drum5());
        beatCount = 24;
      }
      else if(currentTime%4 >= 0/8*4 && currentTime%4 < 3/8*4 && frameCount%4==0){
        onScreenHits.push(new Drum4());
      }

    }
    else if(currentTime<=4*75){//measure 75
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && !beatToggle){
        onScreenHits.push(new Drum3());
        beatToggle = true;
        beatCount=0;
      }
      else if(currentTime%4 >= 15/16*4 && currentTime%4 < 31/32*4 && beatToggle){
        beatToggle = false;
        onScreenHits.push(new Drum3());
        beatCount=0;
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && !beatToggle){

        beatToggle=true;
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        onScreenHits.push(new Snare());
        beatToggle = false;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4 && beatCount==0){
        onScreenHits.push(new Snare());
        beatCount++;
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 25/32*4 && !beatToggle){
        beatToggle = true;
        beatCount=0;
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4 && beatCount==0){
        onScreenHits.push(new Woodblock(2));
        beatCount++;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 21/32*4 && !beatToggle){
        onScreenHits.push(new Woodblock(2));
        beatToggle = true;
        beatCount=0;
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && beatCount==0){
        onScreenHits.push(new Snare());
        beatCount++;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 17/32*4 && !beatToggle){
        onScreenHits.push(new Snare());
        beatToggle = true;
        beatCount=0;
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4 && beatCount==0){
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 13/32*4 && !beatToggle){
        onScreenHits.push(new Woodblock(1));
        beatToggle = true;
        beatCount=0;
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && beatToggle){

        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4 && beatCount==0){
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 7/32*4 && beatToggle){
        onScreenHits.push(new Woodblock(1));
        beatToggle = false;
        beatCount=0;
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && !beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4 && beatCount==0){
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 3/32*4 && beatToggle){
        onScreenHits.push(new Woodblock(1));
        beatToggle = false;
        beatCount=0;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && !beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*76){ //measure 76
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4  && beatCount == 31){
        onScreenHits.push(new Woodblock(5));
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4  && beatCount == 30){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4  && beatCount == 29){
        onScreenHits.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4  && beatCount == 28){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4  && beatCount == 27){
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4  && beatCount == 26){
        onScreenHits.push(new Drum2());
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4  && beatCount == 25){
        onScreenHits.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4  && beatCount == 24){
        onScreenHits.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4  && beatCount == 23){
        onScreenHits.push(new Woodblock(2));
        beatCount++;
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4  && beatCount == 22){
        onScreenHits.push(new Woodblock(2));
        beatCount++;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4  && beatCount == 21){
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4  && beatCount == 20){
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4  && beatCount == 19){
        onScreenHits.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4  && beatCount == 18){
        onScreenHits.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4  && beatCount == 17){
        onScreenHits.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4  && beatCount == 16){
        onScreenHits.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4  && beatCount == 15){
        onScreenHits.push(new Woodblock(4));
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4  && beatCount == 14){
        onScreenHits.push(new Woodblock(4));
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4  && beatCount == 13){
        onScreenHits.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4  && beatCount == 12){
        onScreenHits.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4  && beatCount == 11){
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4  && beatCount == 10){
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4  && beatCount == 9){
        onScreenHits.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4  && beatCount == 8){
        onScreenHits.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4  && beatCount == 7){
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4  && beatCount == 6){
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4  && beatCount == 5){
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4  && beatCount == 4){
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4  && beatCount == 3){

        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4  && beatCount == 2){
        onScreenHits.push(new HiHatDouble());
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4  && beatCount == 1){
        onScreenHits.push(new Woodblock(3));
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4  && beatCount==0){
        onScreenHits.push(new Woodblock(3));
        beatCount++;
      }
    }
    else if(currentTime<=4*77){
      //measure 77
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16* 4&& frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4  && beatCount == 11){
        onScreenHits.push(new Woodblock(1));
        beatCount=0;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4  && beatCount == 10){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4  && beatCount == 9){
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4  && beatCount == 8){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4  && beatCount == 7){
        onScreenHits.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4  && beatCount == 6){
        onScreenHits.push(new Drum4());
        onScreenHits.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4  && beatCount == 5){
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4  && beatCount == 4){
        onScreenHits.push(new Woodblock(3));
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4  && beatCount == 3){
        onScreenHits.push(new Woodblock(3));
        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4  && beatCount == 2){
        onScreenHits.push(new Drum3());
        onScreenHits.push(new Woodblock(3));
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4  && beatCount == 1){
        onScreenHits.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4  && beatCount==0){
        onScreenHits.push(new Woodblock(5));
        onScreenHits.push(new Drum3());
        beatCount++;
      }
    }
    else if(currentTime<=4*78){//measure 78
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
    }
    else if(currentTime<=4*79){ //measure 79
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum2());
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4  && beatCount == 19){
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new HiHatDouble());
        beatCount=0;
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 13/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum2());
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4  && beatCount == 18){
        onScreenHits.push(new Drum5());
        onScreenHits.push(new HiHatDouble());
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4  && beatCount == 17){
        onScreenHits.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4  && beatCount == 16){
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4  && beatCount == 15){
        onScreenHits.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4  && beatCount == 14){
        onScreenHits.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4  && beatCount == 13){
        onScreenHits.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4  && beatCount == 12){
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4  && beatCount == 11){
        onScreenHits.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4  && beatCount == 10){
        onScreenHits.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4  && beatCount == 9){
        onScreenHits.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4  && beatCount == 8){
        onScreenHits.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4  && beatCount == 7){
        onScreenHits.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4  && beatCount == 6){
        onScreenHits.push(new Woodblock(1));
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4  && beatCount == 5){
        onScreenHits.push(new Woodblock(2));
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4  && beatCount == 4){
        onScreenHits.push(new Woodblock(3));
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4  && beatCount == 3){
        onScreenHits.push(new Woodblock(4));
        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4  && beatCount == 2){
        onScreenHits.push(new Woodblock(5));
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4  && beatCount == 1){
        onScreenHits.push(new Woodblock(4));
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4  && beatCount==0){
        onScreenHits.push(new Woodblock(3));
        beatCount++;
      }
    }
    else if(currentTime<=4*80){//measure 80
      //if statements for woodblock/doubles
      if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && beatToggle){
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && !beatToggle){
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && !beatToggle){
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 2/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      //drum roll if-statements
      if(currentTime%4 >= 14/16*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum5());
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 13/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum4());
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 11/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum5());
      }
      else if(currentTime%4 >= 2/8*4 && currentTime%4 < 3/8*4 && frameCount%4==0){
        onScreenHits.push(new Drum2());
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum2());
      }

    }
    else if(currentTime<=4*81){//measure 81
      //if statements for woodblock/doubles
      if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && beatToggle){
        onScreenHits.push(new HiHatDouble());
        beatToggle = false;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && !beatToggle){
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new HiHatDouble());
        beatToggle = true;
      }
      //drum roll if-statements
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 31/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 29/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 27/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum5());
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 7/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum3());
      }
      else if(currentTime%4 >= 1/8*4 && currentTime%4 < 2/8*4 && frameCount%4==0){
        onScreenHits.push(new Drum2());
      }
      else if(currentTime%4 >= 0/8*4 && currentTime%4 < 1/8*4 && frameCount%4==0){
        onScreenHits.push(new Drum4());
        beatToggle = false;
      }

    }
    else if(currentTime<=4*82){ //measure 82
      //if statements for woodblock/doubles
      if(currentTime%4 >= 13/16*4 && currentTime%4 < 15/16*4 && !beatToggle){
        onScreenHits.push(new WoodblockDouble());
        beatToggle = true;
      }
      //drum roll if-statements
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum5());
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 14/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum4());
      }
      else if(currentTime%4 >= 5/8*4 && currentTime%4 < 6/8*4 && frameCount%4==0){
        onScreenHits.push(new Drum3());
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 16/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 9/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 7/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 5/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 3/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
        beatToggle = false;
      }
    }
    else if(currentTime<=4*83){//measure 83
      //if statements for woodblock/doubles
      if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && !beatToggle){
        onScreenHits.push(new WoodblockDouble());
        beatToggle = true;
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && beatToggle){
        onScreenHits.push(new WoodblockDouble());
        beatToggle = false;
      }

      //drum roll if-statements
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum4());
      }
      else if(currentTime%4 >= 14/16*4 && currentTime%4 < 15/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum3());
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 14/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum2());
      }
      else if(currentTime%4 >= 12/16*4 && currentTime%4 < 13/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum3());
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum5());
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 11/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum3());
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 8/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum5());
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 6/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum2());
      }
      else if(currentTime%4 >= 1/16*4 && currentTime%4 < 3/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum4());
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum5());
        beatToggle = true;
      }
    }
    else if(currentTime<=4*84){//measure 84
      //if-statemnts for woodblock double, into 32nd note runs
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4  && beatCount == 31){
        onScreenHits.push(new Woodblock(5));
        onScreenHits2.push(new Drum5());
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4  && beatCount == 30){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4  && beatCount == 29){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4  && beatCount == 28){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4  && beatCount == 27){
        onScreenHits.push(new Woodblock(1));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4  && beatCount == 26){
        onScreenHits.push(new Woodblock(5));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4  && beatCount == 25){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4  && beatCount == 24){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4  && beatCount == 23){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4  && beatCount == 22){
        onScreenHits.push(new Woodblock(1));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4  && beatCount == 21){
        onScreenHits.push(new Woodblock(5));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4  && beatCount == 20){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4  && beatCount == 19){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4  && beatCount == 18){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4  && beatCount == 17){
        onScreenHits.push(new Woodblock(1));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4  && beatCount == 16){
        onScreenHits.push(new Woodblock(5));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4  && beatCount == 15){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4  && beatCount == 14){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4  && beatCount == 13){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4  && beatCount == 12){
        onScreenHits.push(new Woodblock(1));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 1/16*4 && beatToggle){
        onScreenHits.push(new WoodblockDouble());
        beatToggle = false;
        beatCount = 12;
        }

      //drum roll if-statemnts
      if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum5());
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum2());
      }
      else if(currentTime%4 >= 3/16*4 && currentTime%4 < 4/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum3());
      }
      else if(currentTime%4 >= 2/16*4 && currentTime%4 < 3/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum4());
      }
      else if(currentTime%4 >= 0/16*4 && currentTime%4 < 2/16*4 && frameCount%4==0){
        onScreenHits.push(new Drum5());
      }
    }
    else if(currentTime<=4*85){ //measure 85
      if(currentTime%4 >= 31/32*4 && currentTime%4 < 32/32*4  && beatCount == 31){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum2());
        beatCount=0;
      }
      else if(currentTime%4 >= 30/32*4 && currentTime%4 < 31/32*4  && beatCount == 30){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 29/32*4 && currentTime%4 < 30/32*4  && beatCount == 29){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 28/32*4 && currentTime%4 < 29/32*4  && beatCount == 28){
        onScreenHits.push(new Woodblock(5));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 27/32*4 && currentTime%4 < 28/32*4  && beatCount == 27){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 26/32*4 && currentTime%4 < 27/32*4  && beatCount == 26){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 25/32*4 && currentTime%4 < 26/32*4  && beatCount == 25){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 24/32*4 && currentTime%4 < 25/32*4  && beatCount == 24){
        onScreenHits.push(new Woodblock(1));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 23/32*4 && currentTime%4 < 24/32*4  && beatCount == 23){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 22/32*4 && currentTime%4 < 23/32*4  && beatCount == 22){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 21/32*4 && currentTime%4 < 22/32*4  && beatCount == 21){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 20/32*4 && currentTime%4 < 21/32*4  && beatCount == 20){
        onScreenHits.push(new Woodblock(5));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 19/32*4 && currentTime%4 < 20/32*4  && beatCount == 19){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 18/32*4 && currentTime%4 < 19/32*4  && beatCount == 18){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 18/32*4  && beatCount == 17){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 16/32*4 && currentTime%4 < 17/32*4  && beatCount == 16){
        onScreenHits.push(new Woodblock(1));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 32/32*4  && beatCount == 15){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 14/32*4 && currentTime%4 < 15/32*4  && beatCount == 14){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 14/32*4  && beatCount == 13){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 12/32*4 && currentTime%4 < 13/32*4  && beatCount == 12){
        onScreenHits.push(new Woodblock(5));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 12/32*4  && beatCount == 11){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 10/32*4 && currentTime%4 < 11/32*4  && beatCount == 10){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 10/32*4  && beatCount == 9){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4  && beatCount == 8){
        onScreenHits.push(new Woodblock(1));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4  && beatCount == 7){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4  && beatCount == 6){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4  && beatCount == 5){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4  && beatCount == 4){
        onScreenHits.push(new Woodblock(5));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4  && beatCount == 3){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4  && beatCount == 2){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4  && beatCount == 1){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4  && beatCount==0){
        onScreenHits.push(new Woodblock(1));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
    }
    else if(currentTime<=4*86){ //measure 86
      //drum roll if-statements
      if(currentTime%4 >= 15/16*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits2.push(new Drum5());
      }
      else if(currentTime%4 >= 13/16*4 && currentTime%4 < 15/16*4 && frameCount%4==0){
        onScreenHits2.push(new Drum3());
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 13/16*4 && frameCount%4==0){
        onScreenHits2.push(new Drum2());
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 11/16*4 && frameCount%4==0){
        onScreenHits2.push(new Drum4());
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 9/16*4 && frameCount%4==0){
        onScreenHits2.push(new Drum5());
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 7/16*4 && frameCount%4==0){
        print("2nd drum roll");
        onScreenHits2.push(new Drum2());
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && frameCount%4==0){
        print("1st drum roll");
        onScreenHits2.push(new Drum5());
      }

      //woodblock rolls
      if(currentTime%4 >= 7/8*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 6/8*4 && currentTime%4 < 7/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 5/8*4 && currentTime%4 < 6/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 4/8*4 && currentTime%4 < 5/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 3/8*4 && currentTime%4 < 4/8*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }

      //32nd note if-statemnts
      if(currentTime%4 >= 8/32*4 && currentTime%4 < 9/32*4  && beatCount == 8){
        onScreenHits.push(new Woodblock(1));
        beatCount=0;
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4  && beatCount == 7){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4  && beatCount == 6){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4  && beatCount == 5){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum2());
        beatCount++;
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4  && beatCount == 4){
        onScreenHits.push(new Woodblock(5));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4  && beatCount == 3){
        onScreenHits.push(new Woodblock(4));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4  && beatCount == 2){
        onScreenHits.push(new Woodblock(3));
        onScreenHits2.push(new Drum5());
        beatCount++;
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4  && beatCount == 1){
        onScreenHits.push(new Woodblock(2));
        onScreenHits2.push(new Drum4());
        beatCount++;
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4  && beatCount==0){
        onScreenHits.push(new Woodblock(1));
        onScreenHits2.push(new Drum3());
        beatCount++;
      }


    }
    else if(currentTime<=4*87){ //final measure!!
      //drum roll if-statements
      if(currentTime%4 >= 19/32*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits2.push(new Drum5());
      }
      else if(currentTime%4 >= 17/32*4 && currentTime%4 < 19/32*4 && frameCount%4==0){
        onScreenHits2.push(new Drum4());
      }
      else if(currentTime%4 >= 15/32*4 && currentTime%4 < 17/32*4 && frameCount%4==0){
        onScreenHits2.push(new Drum3());
      }
      else if(currentTime%4 >= 13/32*4 && currentTime%4 < 15/32*4 && frameCount%4==0){
        onScreenHits2.push(new Drum2());
      }
      else if(currentTime%4 >= 11/32*4 && currentTime%4 < 13/32*4 && frameCount%4==0){
        onScreenHits2.push(new Drum5());
      }
      else if(currentTime%4 >= 9/32*4 && currentTime%4 < 11/32*4 && frameCount%4==0){
        onScreenHits2.push(new Drum4());
      }
      else if(currentTime%4 >= 0/4*4 && currentTime%4 < 9/32*4 && frameCount%4==0){
        onScreenHits2.push(new Drum5());
      }

      //woodblock rolls
      if(currentTime%4 >= 3/4*4 && currentTime%4 < 16/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 11/16*4 && currentTime%4 < 12/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 10/16*4 && currentTime%4 < 11/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 9/16*4 && currentTime%4 < 10/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 8/16*4 && currentTime%4 < 9/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 7/16*4 && currentTime%4 < 8/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 6/16*4 && currentTime%4 < 7/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 5/16*4 && currentTime%4 < 6/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 4/16*4 && currentTime%4 < 5/16*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 7/32*4 && currentTime%4 < 8/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 6/32*4 && currentTime%4 < 7/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 5/32*4 && currentTime%4 < 6/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(4));
      }
      else if(currentTime%4 >= 4/32*4 && currentTime%4 < 5/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime%4 >= 3/32*4 && currentTime%4 < 4/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(2));
      }
      else if(currentTime%4 >= 2/32*4 && currentTime%4 < 3/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(3));
      }
      else if(currentTime%4 >= 1/32*4 && currentTime%4 < 2/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(5));
      }
      else if(currentTime%4 >= 0/32*4 && currentTime%4 < 1/32*4 && frameCount%4==0){
        onScreenHits.push(new Woodblock(1));
      }

    }
    else if(currentTime<=4*(89+9/16)){ //fermata roll
      if(currentTime >= 4*(89+1/2) && currentTime%4 < 4*(89 +9/16)&& beatToggle){ //final hit
        onScreenHits2.push(new Drum5());
        beatToggle= false;
      }
      else if(currentTime >= 4*(89) && currentTime%4 < 4*(89 +6/16)){
        onScreenHits2.push(new Drum5());
        onScreenHits2.push(new Drum5());
        onScreenHits2.push(new Drum5());
        onScreenHits2.push(new Drum5());
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new Woodblock(1));
        beatToggle= true;
      }
      else if(currentTime >= 4*(88+3/4) && currentTime%4 < 4*(89)){
        onScreenHits2.push(new Drum5());
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime >= 4*(87+11/16) && currentTime%4 < 4*(88+3/4) && frameCount%2==0){ //stage 1 roll
        onScreenHits2.push(new Drum5());
        onScreenHits.push(new Woodblock(1));
        onScreenHits.push(new Woodblock(1));
      }
      else if(currentTime >= 4*(87) && currentTime%4 < 4*(87+11/16) && frameCount%4==0){ //stage 1 roll
        onScreenHits2.push(new Drum5());
        onScreenHits.push(new Woodblock(1));
      }
    }
  }

//update and display every hit in event list, remove from list if duration is over
//auxillary event queue (metronomic woodblocks and ending)
if(onScreenHits2.length>0){ //check if list is empty (it usually is)
    for(c in onScreenHits2){
      //print("update and display "+c);
      if(onScreenHits2[c].isOffScreen()){
        //  print("REMOVED ELEMENT" +c);
        onScreenHits2.splice(c,1);
      }
      if(c>=0 && c<onScreenHits2.length){
        onScreenHits2[c].display();
        onScreenHits2[c].update();
      }
    }
  }

//main event queue
if(currentTime<(89+1/2)*4){ //stop woodblocks from displaying at end
  for(c in onScreenHits){
    //print("update and display "+c);
    if(onScreenHits[c].isOffScreen()){
      //  print("REMOVED ELEMENT" +c);
      onScreenHits.splice(c,1);
    }
    if(c>=0 && c<onScreenHits.length){
      onScreenHits[c].display();
      onScreenHits[c].update();
    }
  }
}


}
