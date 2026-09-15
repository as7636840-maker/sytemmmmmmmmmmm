import {TasksComponent} from './tasks.component'
import {Component,OnInit,OnDestroy,ElementRef,ViewChild,signal} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {HttpClient,HttpParams} from '@angular/common/http'
import {firstValueFrom} from 'rxjs'
import {AuthService} from '../../core/auth.service'
import {PayrollService} from '../../core/payroll.service'
import {environment} from '../../../environments/environment'
import {attendanceStyles} from './attendance.styles'
@Component({selector:'app-attendance',standalone:true,imports:[CommonModule,FormsModule,TasksComponent],templateUrl:'./attendance.component.html',styles:[attendanceStyles]})
export class AttendanceComponent implements OnInit,OnDestroy {
 @ViewChild('detailDialog') detailDialog!:ElementRef<HTMLDialogElement>
 data=signal<any>(null);today=signal<any>(null);detail=signal<any>(null);employees=signal<any[]>([])
 error=signal('');notice=signal('');busy=false;loading=false;dialogError='';history=false;page=1
 filters={date:'',search:'',employee:'',status:'',from:'',to:''}
 update={text:'',status:'Completed'};correction={checkIn:'',checkOut:'',reason:''};correcting=false
 timeZone='Africa/Cairo';serverTime=Date.now();receivedAt=performance.now();tick=signal(0)
 private poll:any;private clock:any;private disposed=false;private sequence=0
 private api=environment.apiUrl+'/attendance'
 constructor(public auth:AuthService,private http:HttpClient,public payroll:PayrollService){}
 async ngOnInit(){await this.load();if(this.auth.isAdmin())try{this.employees.set(await firstValueFrom(this.http.get<any[]>(environment.apiUrl+'/employee-accounts')))}catch(e:any){this.error.set(e.error?.message||e.message)};this.poll=setInterval(()=>{if(!this.busy)void this.load(true)},5000);this.clock=setInterval(()=>this.tick.update(x=>x+1),1000)}
 ngOnDestroy(){this.disposed=true;this.sequence++;clearInterval(this.poll);clearInterval(this.clock)}
 now(){this.tick();return this.serverTime+(performance.now()-this.receivedAt)}
 duration(seconds:number){seconds=Math.max(0,Math.floor(seconds||0));return Math.floor(seconds/3600)+'h '+Math.floor(seconds%3600/60)+'m '+seconds%60+'s'}
 worked(row:any){return row?.checkIn?this.duration(((row.checkOut?Date.parse(row.checkOut):this.now())-Date.parse(row.checkIn))/1000):'—'}
 time(value:string){return value?new Intl.DateTimeFormat('ar-EG',{timeZone:this.timeZone,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(value)):'—'}
 stamp(value:string){return value?new Intl.DateTimeFormat('ar-EG',{timeZone:this.timeZone,dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'—'}
 status(value:string){return ({'Working':'Working — يعمل الآن','Finished':'Finished — انتهى','Not Started':'Not Started — لم يبدأ','Completed':'Completed — مكتمل','In Progress':'In Progress — قيد التنفيذ','Blocked':'Blocked — متعطل'} as any)[value]||value}
 async load(quiet=false){
  const seq=++this.sequence;if(!quiet)this.loading=true
  try{
   let path='/today',query:any={}
   if(this.history){path='/history';query={from:this.filters.from,to:this.filters.to,status:this.filters.status,employee:this.auth.isAdmin()?this.filters.employee:'',page:this.page}}
   else if(this.auth.isAdmin()){path='/dashboard';query={date:this.filters.date,search:this.filters.search,employee:this.filters.employee,status:this.filters.status}}
   query=Object.fromEntries(Object.entries(query).filter(([k,v])=>v!==''))
   const result=await firstValueFrom(this.http.get<any>(this.api+path,{params:new HttpParams({fromObject:query})}))
   if(this.disposed||seq!==this.sequence)return
   this.timeZone=result.timeZone;this.serverTime=Date.parse(result.serverNow);this.receivedAt=performance.now()
   if(!this.filters.date&&result.date)this.filters.date=result.date
   if(!this.auth.isAdmin()&&!this.history)this.today.set(result);else this.data.set(result)
   this.error.set('')
  }catch(e:any){if(!this.disposed&&seq===this.sequence)this.error.set(e.error?.message||e.message)}finally{if(seq===this.sequence)this.loading=false}
 }
 switchMode(history:boolean){this.history=history;this.filters.status='';this.page=1;this.data.set(null);void this.load()}
 reset(){this.filters={date:'',search:'',employee:'',status:'',from:'',to:''};this.page=1;void this.load()}
 async action(kind:'check-in'|'check-out'|'updates'){
  if(this.busy)return;this.busy=true;this.error.set('')
  try{const body=kind==='check-in'?{periodId:this.payroll.currentPeriodId()}:kind==='updates'?this.update:{};await firstValueFrom(this.http.post(this.api+'/'+kind,body));if(kind==='updates')this.update={text:'',status:'Completed'};this.notice.set('تم الحفظ بنجاح');await this.load()}
  catch(e:any){this.error.set(e.error?.message||e.message)}finally{this.busy=false}
 }
 async view(row:any){
  if(!row.id){this.detail.set({employee:row.employee,date:row.date,status:'Not Started',updates:[],audits:[]});this.correcting=false;this.dialogError='';this.detailDialog.nativeElement.showModal();return}
  try{const result=await firstValueFrom(this.http.get<any>(this.api+'/'+row.id));this.detail.set(result);this.correcting=false;this.dialogError='';this.detailDialog.nativeElement.showModal()}catch(e:any){this.error.set(e.error?.message||e.message)}
 }
 timeline(){const d=this.detail();if(!d)return [];return [...(d.checkIn?[{createdAt:d.checkIn,status:'Checked In',text:''}]:[]),...(d.updates||[]),...(d.checkOut?[{createdAt:d.checkOut,status:'Checked Out',text:''}]:[])].sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt))}
 beginCorrection(){const d=this.detail();this.correction={checkIn:d.checkIn,checkOut:d.checkOut||'',reason:''};this.correcting=true}
 async saveCorrection(){
  if(this.busy)return;this.busy=true;this.dialogError=''
  try{await firstValueFrom(this.http.patch(this.api+'/'+this.detail().id+'/correction',{...this.correction,checkOut:this.correction.checkOut||null,revision:this.detail().revision}));this.detail.set(await firstValueFrom(this.http.get<any>(this.api+'/'+this.detail().id)));this.correcting=false;await this.load()}
  catch(e:any){this.dialogError=e.error?.message||e.message}finally{this.busy=false}
 }
 get pages(){return Math.max(1,Math.ceil((this.data()?.total||0)/30))}
 changePage(delta:number){this.page+=delta;void this.load()}
}
