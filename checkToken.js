const router = require("express").Router();
const { checkToken } = require("../auth/token_validation");
const {
  createaccount,
  viewgender,
  dr_bachelor,
  dr_specialization,
  dr_master,
  login,
  studentprofile, 
  currenthealthreport,
  pasthealthreport,
  appointmentdetails,
  consultingdetails,
  insertprescription,
  addprescriptiondetails,
  viewprescriptiondetails,
  viewfood,
  symptom,
  days,
  period,
  count,
  consulting_register,
  consulting_done,
  insert_available,
  view_available,
  update_available,
  consulting_prescription,
  recent_consulting,
  all_appointment,
  consultingdetaillist,
  viewdoctorprofile,
  updatedoctorprofile,
  setdoctorprofile,
  forgotpassword,
  appointment_cancelled,
  cancelled_reason,
  appointment_completed,
  followback_completed,
  worksheet,
  statistics,
  search,
  getusername,
  view_time,
} = require("./user.controller");

router.post("/createaccount", createaccount);
router.get("/viewgender", viewgender);
router.get("/dr_bachelor", dr_bachelor);
router.get("/dr_specialization", dr_specialization);
router.get("/dr_master", dr_master);
router.post("/login",login);
router.get("/studentprofile", checkToken,studentprofile);
router.get("/currenthealthreport", checkToken,currenthealthreport);
router.get("/pasthealthreport", checkToken,pasthealthreport);
router.get("/appointmentdetails", checkToken,appointmentdetails);
router.get("/consultingdetails", checkToken,consultingdetails);
router.post("/insertprescription", checkToken,insertprescription);
router.post("/addprescriptiondetails", checkToken,addprescriptiondetails);
router.get("/viewprescriptiondetails", checkToken,viewprescriptiondetails);
router.get("/viewfood", checkToken,viewfood);
router.get("/symptom", checkToken,symptom);
router.get("/days", checkToken,days);
router.get("/period", checkToken,period);
router.get("/count", checkToken,count);
router.get("/consulting_register", checkToken,consulting_register);
router.get("/consulting_done", checkToken,consulting_done);
router.post("/insert_available", checkToken,insert_available);    
router.get("/view_available", checkToken,view_available);
router.put("/update_available", checkToken,update_available);
router.get("/consulting_prescription", checkToken,consulting_prescription);
router.get("/recent_consulting", checkToken,recent_consulting);
router.get("/all_appointment", checkToken,all_appointment);
router.get("/consultingdetaillist", checkToken,consultingdetaillist);
router.get("/viewdoctorprofile", checkToken,viewdoctorprofile);
router.put("/updatedoctorprofile", checkToken,updatedoctorprofile);
router.put("/setdoctorprofile", checkToken,setdoctorprofile);
router.put("/forgotpassword", forgotpassword);
router.put("/appointment_cancelled", checkToken,appointment_cancelled);
router.get("/cancelled_reason", checkToken,cancelled_reason);
router.put("/appointment_completed", checkToken,appointment_completed);
router.put("/followback_completed", checkToken,followback_completed);
router.get("/worksheet", checkToken,worksheet);
router.get("/statistics", checkToken,statistics);
router.get("/search", checkToken,search);
router.get("/getusername", checkToken,getusername);
router.get("/view_time", checkToken,view_time);


module.exports = router;
