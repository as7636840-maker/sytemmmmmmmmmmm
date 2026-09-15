import {Component,OnInit,ElementRef,ViewChild,signal} from '@angular/core'
import {CommonModule} from '@angular/common'
import {FormsModule} from '@angular/forms'
import {HttpClient} from '@angular/common/http'
import {firstValueFrom} from 'rxjs'
import {AuthService} from '../../core/auth.service'
import {environment} from '../../../environments/environment'
@Component({selector:'app-work-tasks',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./tasks.component.html',styleUrl:'./tasks.component.css'})
export class TasksComponent implements OnInit {
 @ViewChild('imageDialog') imageDialog!:ElementRef<HTMLDialogElement>
 fullImage=''
 openImage(url:string){this.fullImage=url;this.imageDialog.nativeElement.showModal()}
 closeImage(){this.imageDialog.nativeElement.close();this.fullImage=''}
 rows=signal<any[]>([]);page=1;total=0;busy=false;reading=false;loading=false;error='';editing:string|null=null
 form={text:'',status:'Pending'};image:any=undefined;preview=''
 private api=environment.apiUrl+'/tasks'
 constructor(public auth:AuthService,private http:HttpClient){}
 ngOnInit(){void this.load()}
 get pages(){return Math.max(1,Math.ceil(this.total/20))}
 owns(row:any){return !this.auth.isAdmin() && (row.userId?._id||row.userId)===this.auth.user()?.id}
 async load(){this.loading=true;try{const r=await firstValueFrom(this.http.get<any>(this.api,{params:{page:this.page}}));this.rows.set(r.rows);this.total=r.total;this.error=''}catch(e:any){this.error=e.error?.message||e.message}finally{this.loading=false}}
 reset(){this.editing=null;this.form={text:'',status:'Pending'};this.image=undefined;this.preview=''}
 edit(row:any){this.editing=row._id;this.form={text:row.text,status:row.status};this.image=undefined;this.preview=row.image?.url||''}
 async choose(event:Event){const el=event.target as HTMLInputElement,file=el.files?.[0];el.value='';if(!file)return;this.error='';if(!['image/png','image/jpeg'].includes(file.type)||!file.size||file.size>3*1024*1024){this.error='اختر صورة PNG أو JPG حتى 3 MB';return}this.reading=true;try{const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file)});this.image={name:file.name,base64:data.split(',')[1]};this.preview=data}catch{this.error='تعذر قراءة الصورة'}finally{this.reading=false}}
 async save(){if(this.auth.isAdmin()||this.busy||this.reading||(!this.form.text.trim()&&!this.preview))return;this.busy=true;try{const body={...this.form,...(this.image!==undefined?{image:this.image}:{})};await firstValueFrom(this.editing?this.http.patch(this.api+'/'+this.editing,body):this.http.post(this.api,body));this.reset();this.page=1;await this.load()}catch(e:any){this.error=e.error?.message||e.message}finally{this.busy=false}}
 async remove(row:any){if(this.auth.isAdmin()||this.busy||!confirm('حذف هذه المهمة؟'))return;this.busy=true;try{await firstValueFrom(this.http.delete(this.api+'/'+row._id));if(this.editing===row._id)this.reset();if(this.rows().length===1&&this.page>1)this.page--;await this.load()}catch(e:any){this.error=e.error?.message||e.message}finally{this.busy=false}}
}
