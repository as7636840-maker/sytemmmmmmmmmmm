import {Router,json} from 'express'
import {requireAuth} from '../middleware/auth.js'
import WorkTask from '../models/WorkTask.js'
import {fields,fail,objectId} from '../lib/attendance.js'
import {uploadTaskImage} from '../lib/taskUpload.js'
export function taskInput(body) {
  fields(body,['text','status','image'])
  if(body.text!==undefined&&typeof body.text!=='string')throw fail(400,'نص غير صالح')
  const text=(body.text||'').trim(),status=body.status===undefined?'Pending':body.status
  if(text.length>4000||!['Pending','Completed'].includes(status))throw fail(400,'بيانات المهمة غير صالحة')
  return {text,status}
}
const router=Router(),route=fn=>async(req,res,next)=>{try{await fn(req,res)}catch(e){next(e)}}
router.use(requireAuth,(req,res,next)=>{
  if(req.user.role==='admin'&&!['GET','HEAD'].includes(req.method))return res.status(403).json({message:'المهام للعرض فقط للأدمن'})
  next()
},json({limit:'5mb'}),(req,res,next)=>{res.set('Cache-Control','private, no-store');next()})
router.get('/',route(async(req,res)=>{
  fields(req.query,['page'])
  const page=Number(req.query.page||1)
  if(!Number.isInteger(page)||page<1||page>100000)throw fail(400,'صفحة غير صالحة')
  const query=req.user.role==='admin'?{}:{userId:req.user._id}
  const [rows,total]=await Promise.all([WorkTask.find(query).sort({createdAt:-1,_id:-1}).skip((page-1)*20).limit(20).populate('userId','name fullName'),WorkTask.countDocuments(query)])
  res.json({rows,total,page})
}))
router.post('/',route(async(req,res)=>{
  const input=taskInput(req.body)
  if(!input.text&&!req.body.image)throw fail(400,'أضف نصًا أو صورة على الأقل')
  const image=req.body.image?await uploadTaskImage(req.body.image):null
  res.status(201).json(await WorkTask.create({...input,image,userId:req.user._id}))
}))
router.patch('/:id',route(async(req,res)=>{
  fields(req.body,['text','status','image'])
  const row=await WorkTask.findOne({_id:objectId(req.params.id),userId:req.user._id})
  if(!row)throw fail(404,'المهمة غير موجودة')
  const input=taskInput({text:row.text,status:row.status,...req.body})
  let image=row.image
  if(Object.hasOwn(req.body,'image'))image=req.body.image?await uploadTaskImage(req.body.image):null
  if(!input.text&&!image?.url)throw fail(400,'أضف نصًا أو صورة على الأقل')
  Object.assign(row,input,{image});await row.save();res.json(row)
}))
router.delete('/:id',route(async(req,res)=>{
  const row=await WorkTask.findOneAndDelete({_id:objectId(req.params.id),userId:req.user._id})
  if(!row)throw fail(404,'المهمة غير موجودة')
  res.json({deleted:true})
}))
export default router
