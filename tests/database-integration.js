// Run against the initialized local FloodFlow development database.
const d = db.getSiblingDB("floodflow");
const ids = { user: new ObjectId(), area: new ObjectId(), street: new ObjectId(), report: new ObjectId(), request: new ObjectId(), invalidStreet: new ObjectId(), invalidReport: new ObjectId(), duplicateUser: new ObjectId() };
const tag = ids.user.toString();
const now = new Date();
const outcomes = [];
function check(id, fn) {
  try { const actual = fn(); outcomes.push({id, status: "PASS", actual}); }
  catch (e) { outcomes.push({id, status: "FAIL", actual: String(e)}); }
}
function requireTrue(value, message) { if (!value) throw Error(message); }
function expectError(fn, code) { try { fn(); } catch(e) { if (e.code === code) return "Rejected with MongoDB code " + code; throw e; } throw Error("Unexpectedly accepted"); }
const user = {_id:ids.user,name:"Milestone Test User",email:tag+"@example.invalid",password_hash:"test-only-not-a-real-hash",role:"commuter",created_at:now};
const area = {_id:ids.area,name:"Test Area "+tag,barangay:"Test "+tag,city:"Cagayan de Oro",district:"first_district",is_coastal_riverfront:false,is_active:true,created_at:now};
const street = {_id:ids.street,name:"Test Street "+tag,coverage_area_id:ids.area,is_active:true,created_at:now};
const report = {_id:ids.report,street_id:ids.street,reporter_id:ids.user,severity:"high",observed_at:now,expires_at:new Date(now.getTime()+21600000),status:"pending",created_at:now,updated_at:now};
try {
  check("IT-01", () => { d.users.insertOne(user); requireTrue(d.users.findOne({_id:ids.user}).email===user.email,"User not found"); return "User inserted and retrieved"; });
  check("IT-02", () => expectError(() => d.users.insertOne({...user,_id:ids.duplicateUser}),11000));
  check("IT-03", () => { d.coverageareas.insertOne(area); d.streets.insertOne(street); const result=d.streets.aggregate([{$match:{_id:ids.street}},{$lookup:{from:"coverageareas",localField:"coverage_area_id",foreignField:"_id",as:"area"}}]).toArray(); requireTrue(result.length===1 && result[0].area.length===1 && result[0].area[0].name===area.name,"Area lookup failed"); return "Street joined to its coverage area"; });
  check("IT-04", () => expectError(() => d.streets.insertOne({_id:ids.invalidStreet,name:"Invalid Street"}),121));
  check("IT-05", () => { d.floodreports.insertOne(report); const result=d.floodreports.aggregate([{$match:{_id:ids.report}},{$lookup:{from:"streets",localField:"street_id",foreignField:"_id",as:"street"}}]).toArray(); requireTrue(result.length===1 && result[0].street.length===1 && result[0].street[0].name===street.name,"Street lookup failed"); return "Report joined to its street"; });
  check("IT-06", () => expectError(() => d.floodreports.insertOne({...report,_id:ids.invalidReport,severity:"extreme"}),121));
  check("IT-07", () => { d.assistancerequests.insertOne({_id:ids.request,requester_id:ids.user,street_id:ids.street,coverage_area_id:ids.area,report_id:ids.report,request_type:"rescue",description:"Milestone test only",contact_number:"00000000000",number_of_people:NumberInt(2),status:"open",created_at:now,updated_at:now}); const r=d.assistancerequests.aggregate([{$match:{_id:ids.request}},{$lookup:{from:"floodreports",localField:"report_id",foreignField:"_id",as:"report"}}]).toArray(); requireTrue(r.length===1 && r[0].report.length===1 && r[0].report[0].severity==="high","Report lookup failed"); return "Assistance request joined to report"; });
} finally {
  d.assistancerequests.deleteOne({_id:ids.request});
  d.floodreports.deleteMany({_id:{$in:[ids.report,ids.invalidReport]}});
  d.streets.deleteMany({_id:{$in:[ids.street,ids.invalidStreet]}});
  d.coverageareas.deleteOne({_id:ids.area});
  d.users.deleteMany({_id:{$in:[ids.user,ids.duplicateUser]}});
}
printjson(outcomes);
if(outcomes.some(x=>x.status==="FAIL")) quit(1);
