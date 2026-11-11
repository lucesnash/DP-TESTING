'use strict';
/* data.js: demo content (tones, scripted conversation, sign vocabulary) and SAMPLE analytics numbers.
   The analytics constants below are placeholders. DataService.getAnalytics() replaces them with database results. */
const EMO={
  cheerful:{label:'Cheerful',pat:[80,60,80],hint:'Higher pitch, lively energy'},
  calm:{label:'Calm',pat:[400],hint:'Steady pitch, low energy'},
  concerned:{label:'Concerned',pat:[220,140,220],hint:'Lower pitch, hesitant'},
  urgent:{label:'Urgent',pat:[70,50,70,50,70,50,70],hint:'High pitch, high energy'},
  sad:{label:'Sad',pat:[500,200,260],hint:'Low pitch, slow'}
};
const PARTNER_LINES=[
  {text:'Good afternoon! How can I help you today?',emo:'cheerful',hz:214},
  {text:'Of course, one moment. Would you like it cold?',emo:'calm',hz:176},
  {text:"I'm sorry, we're out of cold water. Is room temperature fine?",emo:'concerned',hz:162},
  {text:'Please step back, the floor is wet!',emo:'urgent',hz:238},
  {text:"I'm sorry to hear that. Take your time.",emo:'sad',hz:148}
];
const SIGNER_MSGS=[
  {signs:['Hello','Water','Please'],text:'Hello. Water, please.'},
  {signs:['Yes','Thank you'],text:'Yes. Thank you.'},
  {signs:['Yes','Please'],text:'Yes, please.'},
  {signs:['No','Help'],text:'No. I need help.'}
];
const DEMO=[['p',0],['s',0],['p',1],['s',1],['p',2],['s',2]];
const VOC_FIL={'Hello':'Kumusta','Thank you':'Salamat','Please':'Pakiusap','Yes':'Oo','No':'Hindi','My name is':'Ang pangalan ko ay','Help':'Tulong','Water':'Tubig','Family':'Pamilya','Goodbye':'Paalam'};
const MSG_FIL=['Kumusta. Tubig, pakiusap.','Oo. Salamat.','Oo, pakiusap.','Hindi. Kailangan ko ng tulong.'];
const SLN={asl:'ASL',fsl:'FSL'};
const tw=w=>state.sl==='fsl'?(VOC_FIL[w]||w):w;
const sMsg=i=>{const k=i%SIGNER_MSGS.length,m=SIGNER_MSGS[k];return state.sl==='fsl'?{signs:m.signs.map(tw),text:MSG_FIL[k]}:m};
const VOC=['Hello','Thank you','Please','Yes','No','My name is','Help','Water','Family','Goodbye'];
const pat10=w=>{let h=0;for(const c of w)h=(h*31+c.charCodeAt(0))>>>0;return Array.from({length:10},(_,i)=>12+((h>>>(i*3))&7)*11+(i%3)*2)};


const AN={7:{lab:['Tue','Wed','Thu','Fri','Sat','Sun','Mon'],acc:[88.4,90.1,89.3,92.0,93.1,93.8,94.2],mk:[3],k:[['94.2%','Recognition accuracy'],['91%','Average confidence'],['1.9 s','Sign to text latency'],['18','Sessions']]},
  30:{lab:['Sep 27','Sep 30','Oct 3','Oct 6','Oct 9','Oct 12','Oct 15','Oct 18','Oct 21','Oct 24'],acc:[76.5,79.2,81.0,83.4,84.1,87.0,88.6,90.2,92.5,94.0],mk:[2,6],k:[['94.0%','Recognition accuracy'],['89%','Average confidence'],['2.0 s','Sign to text latency'],['61','Sessions']]}};
const SIGNACC=[['Hello',98],['Thank you',96],['Yes',95],['No',94],['Please',92],['Goodbye',91],['My name is',89],['Family',86],['Help',83],['Water',79]];
const CONF=[['Water ↔ Help',7],['Family ↔ My name is',4],['Please ↔ Thank you',3]];
const SESS=[['Mon 26 Oct','24 min',63,95,2],['Sun 25 Oct','12 min',31,94,1],['Sat 24 Oct','38 min',102,93,4],['Thu 22 Oct','19 min',48,92,3]];