let mongo=require('mongoose');
mongo.connect('mongodb+srv://smabdulla958:16%2FJULY%2F2004@cms.qpyvmpn.mongodb.net/project?retryWrites=true&w=majority&appName=CMS&tls=true'
);
let Schem=mongo.Schema({
     COMPLAINTID:{
 type:String,
 validate:{
     validator:function(value){
         return /^[0-9A-Za-z]$/.test(value)
     }
 }
     },
      Subject:{
        type:String,
        required:true
    },
    Complaint:{
        type:String,
        maxlength:10000,
        
        required:true
    },
     userId:{
         type:mongo.Schema.Types.ObjectId,
         ref:"signups",
         required:true
     },
     ASSIGNS:{
        type:mongo.Schema.Types.ObjectId,
        ref:"assigns"
     },
     Status:{
             type:String,
             default:"Pending", 
         enum:[" Progress","Completed","Pending"]
     }
     
})
let Mod=mongo.model("complaints",Schem);
module.exports=Mod