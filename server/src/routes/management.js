import {Router} from 'express'
import {requireAuth} from '../middleware/auth.js'
import Problem from '../models/Problem.js'
import {fields,text,objectId,fail,workDate} from '../lib/attendance.js'
import {assertPeriodOpen} from './_guards.js'
export function requireManagement(req,res,next){if(!['admin','management'].includes(req.user?.role))return res.status(403).json({message:'الصلاحية للإدارة والأدمن فقط'});next()}
export function daysOpen(row,now=new Date()){return Math.max(0,Math.round((Date.parse(workDate(row.resolvedAt||now))-Date.parse(workDate(row.openedAt)))/86400000))}
const router=Router(),route=fn=>async(req,res,next)=>{try{await fn(req,res)}catch(e){next(e)}}
router.use(requireAuth,requireManagement,(req,res,next)=>{res.set('Cache-Control','private, no-store');next()})
router.use((req,res,next)=>{
  if(!['GET','HEAD'].includes(req.method)&&req.user.role!=='management')return res.status(403).json({message:'المشكلات للعرض فقط للأدمن؛ التعديل للإدارة'})
  next()
})
router.get('/',route(async(req,res)=>{
  fields(req.query,['page','state']);const page=Number(req.query.page||1)
  if(!Number.isInteger(page)||page<1||page>100000)throw fail(400,'صفحة غير صالحة')
  const query={};if(req.query.state){if(!['Open','Resolved'].includes(req.query.state))throw fail(400,'حالة غير صالحة');query.state=req.query.state}
  const [rows,total]=await Promise.all([Problem.find(query).sort({createdAt:-1,_id:-1}).skip((page-1)*20).limit(20).populate('userId','name fullName'),Problem.countDocuments(query)])
  res.json({rows:rows.map(row=>({...row.toObject(),daysOpen:daysOpen(row)})),total,page})
}))
router.post('/',route(async(req,res)=>{fields(req.body,['problem','periodId']);if(!req.body.periodId)throw fail(400,'Payroll period is required');await assertPeriodOpen(req.body.periodId);const now=new Date();res.status(201).json(await Problem.create({problem:text(req.body.problem),periodId:objectId(req.body.periodId),userId:req.user._id,openedAt:now,history:[{state:'Open',changedBy:req.user._id,at:now}]}))}))
router.patch('/:id',route(async(req,res)=>{
  fields(req.body,['state']);const state=req.body.state
  if(!['Open','Resolved'].includes(state))throw fail(400,'حالة غير صالحة')
  const now=new Date(),changes={state,resolvedAt:state==='Resolved'?now:null}
  if(state==='Open')changes.openedAt=now
  const row=await Problem.findOneAndUpdate({_id:objectId(req.params.id),state:{$ne:state}},{$set:changes,$push:{history:{state,changedBy:req.user._id,at:now}}},{new:true,runValidators:true})
  if(!row)throw fail(409,'السجل تغيّر أو غير موجود؛ حدّث القائمة')
  res.json(row)
}))
export default router
