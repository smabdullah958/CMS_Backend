 process.env.Email_User="smabdulla958@gmail.com"
process.env.Email_Pass="cmjy httq irvc tltz";
console.log(process.env.Email_Pass,process.env.Email_User)

let Express =require('express');
let Cors=require('cors');
let JWT=require('jsonwebtoken');
 let cookieParser=require('cookie-parser');
let nodemailer=require('nodemailer');
let multer=require("multer");

 //this is a 1st collection which is signup
 let Mongo=require('./SignupCollection') //user detail

 // this is a 2nd collection which is Complaint
let dbms=require('./ComplaintCollection'); //complaint detail

//this is a 3rd collection which is a Assign
let Assigns=require("./AssignCollection");

let path=require("path");
const { default: mongoose, mongo, Mongoose } = require("mongoose");
const { populate } = require("dotenv");
const { Console } = require("console");

 let App=Express();
App.use(Express.json())
App.use(Cors({
    origin:"http://localhost:5173",
    credentials:true
}))
App.use(cookieParser());   
App.use('/upload',Express.static(path.join(__dirname,"upload")));

//this is a nodemailer transporter 
const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.Email_User,
        pass:process.env.Email_Pass
    }
})
console.log("email",process.env.Email_User)
console.log("pasword",process.env.Email_Pass)


//now here multer is start

let storage= multer.diskStorage({
destination:function (req,file,cb){
    cb(null,"./upload")
},

filename: function(req,file,cb){
cb(null,Date.now()+ "-"+file.originalname);
},
})
//now apply validation on a image
const fileFilter=(req,file,cb)=>{
const allowedtype=["image/jpg","image/png","image/jpeg"];

if(!allowedtype.includes(file.mimetype)){
return cb(new Error("invalid file type only png jpg and jpeg is allowed"),false)
}
cb(null,true)
}
const upload = multer({storage,
    fileFilter,
    limits:{fileSize:200*1024},//limit only200kb file is allowd
});



//for signup
App.post('/SignUps',upload.single('image'), async function(req,res){


    // if(!req.file){ 
    //     return res.status(400).json("file is required")
    // }
try{
    //this is mainly used for a validation
      let {username,password,email,profile,study,dep,rollno}=req.body

      if(!req.file){
        return res.status(400).json("file is required")
      }
      
    //check if email is exist already
    let imagepath=req.file.filename;
    imagepath=imagepath.replace(/^.*\/upload\//,'/upload/')

    if(profile==="student"){
    let exist=await Mongo.findOne({email})
    if(exist){
        return res.status(400).json({error:"email is already exist"})
    }
    console.log("ready")
    }

    //check if rollno is exist for a student
    if(profile==="student"){
    let existRollno=await Mongo.findOne({rollno})   
    if(existRollno){
        return res.status(400).json({error:"ROLL NO is exist"})
    }
    }
    //generate salt and hash
         let salt=await bcrypt.genSalt(10);
         let hash=await bcrypt.hash(password,salt)  ;       
         

         if(!dep){
            dep=null
         }
            let newuser=new Mongo({
                username,
                //here in password hash is store
                password:hash,
                email,
                profile,
                study,
                dep,
                rollno,
                image:imagepath 
            });
            
            let data=await newuser.save();
            console.log(" file is submitted successfully")
            //now JWT
            let token = JWT.sign({email},"abdullaljlkjlkjk",{expiresIn:"30d"}
            );

            res.cookie("token",token,{
                httpOnly:true,
                secure:true,
                maxAge:30*24*60*60*1000
            })
        
           res.send(data)
           console.log(data);        
        }
catch(err){
    console.log(err)
    res.status(500).json('internal error')
}
})

//for login
App.post('/login',async(req,res)=>{
    try{
        let {email}=req.body;
        let Login=await Mongo.findOne({email}).populate("complaints","Complaint")
        //to check if not user is present
        if(!Login){
            return res.status(401).json("user not found")
        }
        
        let IsMatch=await bcrypt.compare(req.body.password,Login.password);
        
        //to check that password is matched or not 
        if(!IsMatch){
            return res.status(400).json("invalid email or password")
        }
        console.log("login successfully")

        //generate token and send to the browser
         let token=JWT.sign({email},"abdullaljlkjlkjk",{expiresIn:"30d"})
         res.cookie("token",token,{
             httpOnly:true,
             secure:true,
             maxAge:30*24*60*60*1000
         })

         let imagepath=Login.image;
         imagepath=imagepath.replace(/^.*\/upload\//,'/upload/')
          
         res.send({token,
            email:Login.email,
            username:Login.username,
            profile:Login.profile,
            complaints:Login.complaints,
            study:Login.study,
            dep:Login.dep,
            rollno:Login.rollno,
            image:imagepath

         })
        console.log(Login.complaints)
    }
    catch(error){

        console.log(error)
    }
})


//for logout    
App.get('/logout',(req,res)=>{
    res.cookie("token","",{
        httpOnly:true,
        secure:false,
        expires:new Date(0)
    })
    console.log("logout successfully")
    res.json("logout successfully")
    
});

//for compalint


App.post('/complaint',async(req,res)=>{
    try{
    
        let token=req.cookies.token;
        console.log(token)
        
        if(!token){
            console.log("unauthorized")
            return res.status(201).json("unauthorized")
        }
        let decode=JWT.verify(token,"abdullaljlkjlkjk");
        let user = await Mongo.findOne({email:decode.email});//find user by email
        if(!user){
            res.status(202).json("user not found")
        }


    let {Subject,Complaint}=req.body
    
    
    console.log(req.body)

    
 
    if(!Subject||!Complaint){
        return res.status(400).json("all fields are required")
    }
    
    
 
    let post=new dbms({
        Subject,
        Complaint,
         userId:user._id
        
    });


    
    let submit= await post.save(); //save the complaint

    console.log("fond")
   

user.complaints.push(submit._id)
await user.save()

    console.log(submit,"display")
    
 
//here we find email of hod or principal

let recipients=await Mongo.find({profile:{
    $in:["Principal","HOD"]
}}).select("email")

// Extract email
let recipientEmail=recipients.map(user=>user.email);

if(recipientEmail.length===0){
    console.log("no principal or hod is present")
    return res.status(123).json("no hod and principal is found")
};

console.log("sending email to ",recipientEmail)

//send email notification

let mailoption={
    from:"smabdulla958@gmail.com",
    to:recipientEmail.join(','), //send email to hod and principal
    subject:`New complaint is register from ${user.username}`,
    text:`A new complaint has been submitted 
    \n Student RollNo: ${user.rollno}
    \n student Name: ${user.username},
    \n Email: ${user.email},
    \n Department: ${user.dep}
    \n Complaint: ${Complaint}
    \n Complaint ID:${submit._id}
    `
};

transporter.sendMail(mailoption,(err,info)=>{
    if(err){
        console.log("error in sending mail ",err)
    }
    else{
        console.log("email is sending successfully ")
    }
});

//i want to send only first 8 charater of a ._id 
let complaintShort=submit._id.toString().substring(0,8) //first 8 character

//send email to the user
let EmailForUser={
    from:"smabdulla958@gmail.com",
    to:user.email,
    subject:"your Complaint has been register",
    text:`Dear ${user.username},
    \n\n Your Complaint has been register with a following details:
    \n Complaint ID:${complaintShort}
    \nSubject:${Subject}
    \n Complaint:${Complaint};
    \n\n You can use the Complaint ID  to track the status of the complaint
    \n\n Thank you`
};
transporter.sendMail(EmailForUser,(err,info)=>{
    if(err){
        console.log("error is sending ",err);
    }
    else{
        console.log("confirmatin email is send to a user");
    }
});
res.send(submit)
}
    catch(error){
        console.log("error",error)
    }   
})

App.get('/display',async(req,res)=>{
    try{    let display=await Mongo.find().populate({
        path:"complaints",  //this complaints path is present in a signup
        select:" Complaint _id Status ASSIGNS",
        populate:{
            path:"ASSIGNS",//THIS ASSIGNS path is present in a complaint path
            model:'assigns',
            select:"AssignTO"
        }
    }).select("rollno  email  complaints") ;
   
    console.log("dispaly",display)
    res.send(display);
}
    catch(err){
        console.log(err,"erro")
    }
})

App.get('/search/:key',async(req,res)=>{
    try{
        let query={$or:[
  
        {
            email:{$regex:req.params.key,$options:'i'}
  
                  }          ,{
            rollno:{$regex:req.params.key}
        }
    ]}
if(mongoose.Types.ObjectId.isValid(req.params.key)){
    query.$or.push({complaints:new mongoose.Types.ObjectId(req.params.key)})
}
let  search=await Mongo.find(query).populate({
        path:"complaints",  //this complaints path is present in a signup
        select:" Complaint _id Subject userId",
        populate:{

            path:"ASSIGNS",//THIS ASSIGNS path is present in a complaint path
            model:'assigns',
            select:"AssignTO"
        }
    }).select("rollno  email  complaints")
res.send(
    search
)
 
    console.log("result",search);
    }
    catch(error){
        console.log("error",error);
    } 
})

App.post('/Assign',async function(req,res){
try{
    let {ComplaintID,AssignTO}=req.body;
if(!AssignTO||!ComplaintID){
console.log("eror ")
} 

let complaint=await dbms.findById(ComplaintID);
if(!complaint){
    return res.status(404).send("complaint is not found");
}

//check if the complaint is already assign 
if(complaint.ASSIGNS){
    console.log("complaint is already assign")
    return res.status(403).json("complaint is already assign")
}


    let result=new Assigns({ComplaintID,
        AssignTO,
        ComplaintRef:complaint._id //link toa  complaint ObjectId
    });
    let data=await result.save();
    complaint.ASSIGNS=data._id
    await complaint.save()
    res.send(data)
console.log(data)
}
catch(error){
    console.log("error",error)
}
})

App.get('/VIEWHOD',async(req,res)=>{
    try{
        let token=req.cookies.token;
        if(!token){
            return res.status(404).json("unauthorized person")
        }
                let decode=JWT.verify(token,"abdullaljlkjlkjk");
        
        let user=await Mongo.findOne({email:decode.email})
        //find user
        if(!user||user.profile!=="HOD"){
            return res.status(405).json("only hod can access this route")
        }
        //fetch all teh complaints which are assign by te principal
        let ViewHOD=await Assigns.find({AssignTO:user.dep}).populate({
            path:"ComplaintRef",
            select:"Subject Complaint _id Status"
        })
        
        res.send(ViewHOD);
        console.log(ViewHOD)
    }
    catch(error){   
        console.log("eror",error)
    }
})

App.get('/VIEWHOD/:key',async(req,res)=>{
try{ 
    const complaintId=req.params.key
    console.log(complaintId)    
    if(!mongoose.Types.ObjectId.isValid(complaintId)){
        console.log("invalid")
        return res.status(404).json("invalid id")
    }

        let SEARCH=await Assigns.findOne({
            ComplaintRef:new mongoose.Types.ObjectId(complaintId)
        }).populate(
        {
            path:"ComplaintRef",
            select:"Subject Complaint _id " 
               }
    )
    if(!SEARCH||!SEARCH.ComplaintRef){
console.log("not found")
console.log(complaintId)
        return res.status(404).json("user is not found")

    }
res.send(SEARCH);
console.log("SEARCH SECCUESSFULLY",SEARCH);
}
catch(eror){
    console.log("error",eror)
res.status(500).json("inter error")
}
})

App.put("/updateStatus",async(req,res)=>{
    console.log("update is run")
        let {Status,COMPLAINTID}=req.body;
        if(!COMPLAINTID||!Status){
            return res.status(400).json("all fields must be filled")
        }
        console.log("checking update")

        if(COMPLAINTID.length!==8){
            console.log("8 digits are allowed ")
            return res.status(400).json("8 digits allowed")
        }
        console.log("WORKING")
        try{
            // let complain=await dbms.findOne({COMPLAINTID:COMPLAINTID})
            let complain = await dbms.aggregate([
                {
                    $match: {
                        $expr: {
                            $eq: [
                                { $substr: [{ $toString: "$_id" }, 0, 8] }, // Extract first 8 characters of _id
                                COMPLAINTID
                            ]
                        }
                    }
                }
            ]);
    
            // check if complaint is exist or not
        
            if(!complain||complain.length===0){
            console.log("complain not found");
            return res.status(404).json("complaint not found");
        }
        //get the first complaint object
        let updatecomplaint=complain[0]
         //check if complaint status is completed
        if(updatecomplaint.Status==="Completed"){
            console.log("statu is already resolved");
            return res.status(403).json("complaint is already resolved")
        }

        
        
        let data=await dbms.findByIdAndUpdate(updatecomplaint._id,{Status:Status},{new:true})
        
        
        
        res.send(data);
        console.log(data);
        }
        catch(err){
            return res.status(500).json("internal error")
        }
})
// App.get("/SEARCHING/:key",async (req,res)=>{
//     try{
//     let ComplaintID=req.params.key
//     //for correct  8 digits
//     if(!/^[0-9a-zA-Z]$/.test(ComplaintID)){
//         return res.status(400).json("enter 8 digits")
//     }
//     //this is for a check the full id a mongo id or not
//     // if(!mongoose.Types.ObjectId.isValid(ComplaintID)){
//     //     console.log("invalid id");
//     //     return res.status(404).json("invalid id");
//     // }
//     //for complete id which is 24 digits
//     // let SEARCH=await Assigns.findOne({
//     //     ComplaintRef:new mongoose.Types.ObjectId(ComplaintID)}).populate({
//     //for 8 digits
//     let SEARCH=await Assigns.aggregate([{
//         $match:{
//             $expr:{
//                 $eq:[
//                     {
//                         $substr:[{
//                             $toString:"$_id"
//                         },0,8]
//                     },
//                 ComplaintID    
//                 ]
//             }
//         }
//     }
// ]);
// if(!SEARCH||SEARCH.length===0){
//     console.log("search is not fund");
//     return res.status(404).json("not ufound")
// }

// let populateComplaint=await Assigns.populate({
//     path:"ComplaintRef",
//             select:"Subject Complaint Status",
//             populate:{
//                 path:"userId",
//                 select:"username rollno "
//             }
//         }
//     ).select("AssignTO")
//     //if id is not found
//     if(!populateComplaint){
//         //for completer id whihc is 24 digits
//        // let unassigned=await dbms.findById(ComplaintID).populate({
//        //for 8 digits only
//        let unassigned=await dbms.aggregate([{
//         $match:{
//             $expr:{
//                 $eq:[
//                     {
//                         $substr:[{
//                             $toString:"$_id"
//                         },0,8]
//                     },
//                 ComplaintID    
//                 ]
//             }
//         }
//     }
// ]);
// let unassignedcomplaint=await dbms.populate({  
//        path:"userId",
//             select:"username rollno"
//         })
//         if(!unassigned){
//             console.log("not found id");
//             return res.status(400).json("not found")
//         }
//         let result={
//             ComplaintRef:{
//                 Subject:unassignedcomplaint.Subject,
//                 Complaint:unassignedcomplaint.Complaint,
//                 Status:unassignedcomplaint.Status,
//                 userId:unassignedcomplaint.userId
//             },
//             AssignTO:"Not Assigned Yed"
//         }
//         console.log("unassing commplaind is found",unassignedcomplaint);
//         return res.send(unassignedcomplaint)
//     }
            
//     console.log("good")
//     res.send(populateComplaint)
//     console.log("successfully",populateComplaint)
// }
// catch(err){
//     console.log("eror",err);
//     res.status(500).send("internal error");
// }
// })

App.get("/SEARCHING/:key", async (req, res) => {
    try {
        const key = req.params.key;

        // Validate that the key is exactly 8 characters long and alphanumeric
        if (!/^[a-fA-F0-9]{8}$/.test(key)) {
            console.log("Invalid key format");
            return res.status(400).json("Key must be exactly 8 alphanumeric characters");
        }

        // Step 1: Find the complaint using the first 8 characters of _id
        let complaint = await dbms.findOne({
            $expr: {
                $eq: [
                    { $substr: [{ $toString: "$_id" }, 0, 8] }, // Extract first 8 characters of _id
                    key
                ]
            }
        });

        // If no matching complaint is found
        if (!complaint) {
            console.log("Complaint not found");
            return res.status(404).send("Complaint not found");
        }

        // Step 2: Fetch related user details manually
        let user = await Mongo.findById(complaint.userId).select("username rollno");

        // Step 3: Check if the complaint is assigned
        let assignDetails = null;
        if (complaint.ASSIGNS) {
            assignDetails = await Assigns.findById(complaint.ASSIGNS).select("AssignTO");
        }

        // Step 4: Construct the response
        let result = {
            ComplaintRef: {
                Subject: complaint.Subject,
                Complaint: complaint.Complaint,
                Status: complaint.Status,
                userId: user
            },
            AssignTO: assignDetails ? assignDetails.AssignTO : "Not Assigned Yet"
        };

        console.log("Search successful:", result);
        res.send(result);
    } catch (err) {
        console.log("Error:", err);
        res.status(500).send("Internal error");
    }
});
App.listen(5678)