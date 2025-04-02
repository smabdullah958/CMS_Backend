
let mongo=require('mongoose');
mongo.connect('mongodb+srv://smabdulla958:16%2FJULY%2F2004@cms.qpyvmpn.mongodb.net/project?retryWrites=true&w=majority&appName=CMS',{
    tls:true
})
    let Schem=mongo.Schema({
    
    username:{
        type:String,
        required:true, 
        minlength:5
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    
    password:{
        type:String,
        required:true,
        minlength:5
    },
    profile:{
        type:String,
        required:true,
        enum:['student','Principal','HOD']
    },study:{
        type:String
    },
    dep:{
        type:String,
        enum: ["CS", "Bio", "Chemistry", "Physics", "Stats", "Political Science", "Arts", "Maths", "History"],
      default:null,
        required:false
    },
    rollno:{
        type:String,
        validate:{
            validator:function(value){
                if(this.profile==="student"){
                return /^\d{4}$/i.test(value);
            }
            return value===''||value===null||this.profile!=="student"
            },
            message:(props)=> `$(props.value) is not a valid roll number`
        },
        uniqued:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
        image:{
    type:String
        },

    //it will create relation with a complaints collection
    complaints:[{
        type:mongo.Schema.Types.ObjectId,
        ref:"complaints"
    }]
    })
let Mongo=mongo.model('signups',Schem)
module.exports=Mongo