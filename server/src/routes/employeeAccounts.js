import {Router} from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import {requireAuth,requireAdmin} from '../middleware/auth.js'
import {fields,text,passwordValue,objectId,accountView,fail} from '../lib/attendance.js'
const router=Router();router.use(requireAuth,requireAdmin)
const route=fn=>async(req,res,next)=>{try{await fn(req,res)}catch(e){if(e.code===11000)return res.status(409).json({message:'البريد الإلكتروني مستخدم بالفعل'});if(e.status)return res.status(e.status).json({message:e.message});next(e)}}
function emailValue(v){const email=text(v,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw fail(400,'بريد إلكتروني غير صالح');return email}
function roleValue(v){if(!['ADMIN','EMPLOYEE','MANAGEMENT'].includes(v))throw fail(400,'دور غير صالح');return v.toLowerCase()}
router.get('/',route(async(req,res)=>{const users=await User.find().sort({name:1}).select('-passwordHash');res.json(users.map(accountView))}))
router.post('/',route(async(req,res)=>{fields(req.body,['fullName','email','temporaryPassword','role']);const fullName=text(req.body.fullName,120),email=emailValue(req.body.email),role=roleValue(req.body.role),passwordHash=await bcrypt.hash(passwordValue(req.body.temporaryPassword),12);const u=await User.create({name:fullName,fullName,email,passwordHash,role,status:'ACTIVE'});res.status(201).json(accountView(u))}))
router.get('/:id',route(async(req,res)=>{const u=await User.findById(objectId(req.params.id)).select('-passwordHash');if(!u)throw fail(404,'الموظف غير موجود');res.json(accountView(u))}))
router.patch('/:id',route(async(req,res)=>{
 fields(req.body,['fullName','email','role','status']);const u=await User.findById(objectId(req.params.id));if(!u)throw fail(404,'الموظف غير موجود')
 if(String(u._id)===String(req.user._id)&&((req.body.role&&req.body.role!=='ADMIN')||req.body.status==='INACTIVE'))throw fail(409,'لا يمكنك تعطيل حسابك الإداري أو إزالة صلاحياته')
 if(req.body.fullName!==undefined)u.name=u.fullName=text(req.body.fullName,120)
 if(req.body.email!==undefined)u.email=emailValue(req.body.email)
 if(req.body.role!==undefined){const role=roleValue(req.body.role);if(!(role==='employee'&&['staff','streamer'].includes(u.role)))u.role=role}
 if(req.body.status!==undefined){if(!['ACTIVE','INACTIVE'].includes(req.body.status))throw fail(400,'حالة غير صالحة');if(u.status!==req.body.status)u.tokenVersion=(u.tokenVersion||0)+1;u.status=req.body.status}
 await u.save();res.json(accountView(u))
}))
router.post('/:id/reset-password',route(async(req,res)=>{fields(req.body,['temporaryPassword']);const passwordHash=await bcrypt.hash(passwordValue(req.body.temporaryPassword),12);const u=await User.findByIdAndUpdate(objectId(req.params.id),{$set:{passwordHash},$inc:{tokenVersion:1}},{new:true});if(!u)throw fail(404,'الموظف غير موجود');res.json({id:String(u._id),reset:true})}))
export default router
