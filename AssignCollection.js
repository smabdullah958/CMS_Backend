let mongoose=require("mongoose");
mongoose.connect('mongodb+srv://smabdulla958:16%2FJULY%2F2004@cms.qpyvmpn.mongodb.net/?retryWrites=true&w=majority&appName=CMS/project');
let Schem=mongoose.Schema({
    
    ComplaintID:{
        type:String,
        required:true,
        validate:{
        validator:function(value){
            return /^[a-zA-Z0-9]+$/.test(value);
        }}
    },AssignTO:{
        type:String,
        required:true,
        enum:["CS", "Bio", "Chemistry", "Physics", "Stats", "Political Science", "Arts", "Maths", "History"]
    },
     ComplaintRef:{
         type:mongoose.Schema.Types.ObjectId,
         ref:"complaints"     }
        
})
let MODEL=mongoose.model('assigns',Schem)
module.exports=MODEL