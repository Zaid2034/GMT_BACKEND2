const express=require('express')
const cors=require('cors')
const app=express()
const zod = require ('zod');
const {User,TrackingToken}=require('./db')
const jwt = require ('jsonwebtoken');
const dotenv = require ('dotenv');
const { authMiddleware } = require('./authMiddleware');
const { ok } = require('assert');
dotenv.config ();

const JWT_SECRET=process.env.JWT_SECRET

//app.use(cors())
app.use(cors({
    origin:['https://zaid-gmt-frontend.vercel.app/'],
    methods:['POST','GET'],
    credentials:true
}));
app.use(express.json())

const signUpSchema = zod.object ({
  email:zod.string(),
  username: zod.string (),
  password: zod.string (),
});
const signinBody = zod.object ({
  email: zod.string (),
  password: zod.string (),
});



app.get('/',(req,res)=>{
    res.json({
        message:"hello"
    })
})
app.post ('/signup', async (req, res) => {
  console.log ('In signup');
  console.log ('jwt secret is:', JWT_SECRET);
  try {
    const body = req.body;
    const {success} = signUpSchema.safeParse (req.body);
    if (!success) {
      return res.json ({
        message: 'Email already taken/ Incorrect inputs',
      });
    }
    const user = await User.findOne ({
      username: body.username,
    });

    if (user) {
      return res.json ({
        message: 'Email already taken/ Incorrect inputs',
      });
    }
    const dbUser = await User.create (body);
    console.log ('db user:', dbUser.id);
    const token = jwt.sign (
      {
        userId: dbUser._id,
      },
      JWT_SECRET
    );
    res.json ({
      message: 'User created successfully',
      token: token,
    });
  } catch (error) {
    console.log (error);
  }
});

app.post ('/signIn', async (req, res) => {
    try{
        const {success} = signinBody.safeParse (req.body);
        if (!success) {
            return res.status (411).json ({
            message: 'Incorrect inputs',
            });
        }
        const user = await User.findOne ({
            email: req.body.email,
            password: req.body.password,
        });

        if (user) {
            const token = jwt.sign (
            {
                userId: user._id,
            },
            JWT_SECRET
            );

            res.json ({
            message:"Signed In successfully",
            token: token,
            });
            return;
        }
        res.status (411).json ({
            message: 'Error while logging in',
        });

    }catch(error){
        console.log(error)
    }
  
});
app.get('/success',authMiddleware,(req,res)=>{
    try{
        const userId = req.userId;
        const user = User.findOne ({
        _id: userId,
        });
        if (user) {
        res.json ({
            message: 'OK',
        });
        } else {
        res.json ({
            message: 'error',
        });
        }
    }catch(err){
        res.json({
            "error":err
        })
    }
    
})
app.post('/storeToken',async(req,res)=>{
    try{
        const token = req.body.token;
        console.log("Token is:",token)
        await TrackingToken.create ({
            token:token,
        });
        res.json ({
            token,
        });
    }catch(err){
        res.json({
            err
        })
    }
})
app.get('/getToken',async(req,res)=>{
    try{
        const token=req.headers.token
        console.log("token is:",token)
        const trackingToken=await TrackingToken.findOne({
            token:token
        })
        console.log("tracking token is:",trackingToken)
        if(trackingToken){
            res.json({
                "message":"OK"
            })
        }else{
            res.json({
                "message":"Token Not Found"
            })
        }
    }catch(err){
        res.json({
            err
        })
    }
})


app.listen(3000,()=>{
    console.log('Server is running at port 3000')
})