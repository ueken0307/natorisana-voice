'use babel';

//import NatorisanaVoiceView from './natorisana-voice-view';
import { CompositeDisposable } from 'atom';

export default {

  config:{
    '音量':{
      'type':'integer',
      'default':100,
      'minimum':0,
      'maximum':1000,
      'description':'[%] (1~1000)',
      'order':1
    },
    
    'おはようございナース！':{
      'type':'boolean',
      'default':'true',
      'description':'natorisana-voice起動時',
      'order':2
    },
    
    'てねっ':{
      'type':'boolean',
      'default':'true',
      'description':'改行時',
      'order':3
    },
    
    'あい～':{
      'type':'boolean',
      'default':'true',
      'description':'ファイル保存時',
      'order':4
    },
    
    'はいはい':{
      'type':'boolean',
      'default':'true',
      'description':'コマンド実行時',
      'order':5
    },
    
    'うんうん':{
      'type':'boolean',
      'default':'false',
      'description':'編集を止めたとき',
      'order':6
    },
    
    'カウントダウン':{
      'type':'boolean',
      'default':'false',
      'description':'数字キー押したとき',
      'order':7
    }
  },
  
  subscriptions: null,
  context:null,
  sa_na:null,
  
  vStart:null,
  vAi:null,
  vHihi:null,
  vCheer:null,
  vTene:null,
  vUnun:null,
  vCountDown:[],
  
  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'natorisana-voice:toggle': () => this.toggle()
    }));
    
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'natorisana-voice:cheer': () => this.play(this.vCheer)
    }));
    
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'natorisana-voice:sa~na': () => this.insert()
    }));
    
    this.context = new window.AudioContext();
    this.loadVoice();
    this.eventSet();
    
    
    let path = atom.packages.getPackageDirPaths()[0]+'/natorisana-voice/sa-na.txt';
    let request = new XMLHttpRequest();
    request.open('GET',path,true);
    request.responseType = 'text';
    request.send();
    request.onload = ()=>{
      this.sa_na = request.response;
    }
  },

  deactivate() {
    this.subscriptions.dispose();
    this.context.dispose();
  },

  serialize() {
  },

  toggle() {
  },

  eventSet(){
    atom.keymaps.onDidMatchBinding((event)=>{
      switch (event.binding.command) {
        case 'editor:newline':
          //改行
          if(atom.config.get('natorisana-voice.てねっ')){
            this.play(this.vTene);
          }
          break;
        
        case 'core:confirm':
          //確定
          if(atom.config.get('natorisana-voice.はいはい')){
            this.play(this.vHihi);
          }
          break;
          
        default:
          
      }
    });
    
    atom.workspace.observeTextEditors(editor => {
      let buffer = editor.getBuffer();
      
      //カウントダウン
      buffer.onDidChange((event)=>{
        if(atom.config.get('natorisana-voice.カウントダウン')){
          let text = buffer.getTextInRange(event.newRange);
          if(text.length == 1){
            for(let i=0;i<10;++i){
              if(text == i.toString()){
                this.play(this.vCountDown[i]);
                break;
              }
            }
          }
        }  
      });
      
      buffer.onDidStopChanging((event)=>{
        if(atom.config.get('natorisana-voice.うんうん')){
          if(event.changes.length){
            let text = event.changes[0].newText;
            if(text.indexOf('\n')==-1 && text.indexOf('\r')==-1){
              this.play(this.vUnun);
            }
          }
        }
      });
      
      buffer.onDidSave((event)=>{
        if(atom.config.get('natorisana-voice.あい～')){
          this.play(this.vAi);
        }
      });
      
    });
  },

  getFile(filename,callback){
    let path = atom.packages.getPackageDirPaths()[0]+'/natorisana-voice/voice/';
    let request = new XMLHttpRequest();
    request.open('GET',path+filename+'.mp3',true);
    request.responseType = 'arraybuffer';
    request.send();
    request.onload = ()=>{
      let res = request.response;
      this.context.decodeAudioData(res,(buf)=>{
        callback(buf);
      });
    };
  },

  loadVoice(){
    //おはようございナース
    this.getFile('oha',(buf)=>{this.vStart = buf;
      if(atom.config.get('natorisana-voice.おはようございナース！')){
        this.play(this.vStart);
      }
    });
    
    //あい～
    this.getFile('ai~',(buf)=>{this.vAi = buf;});
    
    //はいはい
    this.getFile('hihi',(buf)=>{this.vHihi = buf;});
    
    //応援
    this.getFile('ganbare',(buf)=>{this.vCheer = buf;});
    
    //てねっ
    this.getFile('tene', (buf)=>{this.vTene = buf;});
    
    //うんうん
    this.getFile('unun',(buf)=>{this.vUnun = buf;});
    
    //カウントダウン
    for(let i=0;i<10;i++){
      this.getFile('countdown/'+i,(buf)=>{this.vCountDown[i] = buf;});
    }
    
  },

  play(buffer){
    
    let source = this.context.createBufferSource();
    source.buffer = buffer;
    
    let gain = this.context.createGain();
    gain.gain.value = atom.config.get('natorisana-voice.音量')*0.01;
    
    gain.connect(this.context.destination);
    source.connect(gain);
    
    source.start(0);
  },
  
  insert(){
    let editor = atom.workspace.getActiveTextEditor()
    editor.insertText(this.sa_na,{select:true,autoIndentNewline:true});
  }
  
};
