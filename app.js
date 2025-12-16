const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config()
// const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./middleware/auth');


const app = express();
const PORT = 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL).then(() => {
    console.log('Connected to MongoDB');
});

// Define User schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: {type: String, required: true},
});

const User = mongoose.model('User', userSchema);
// Student Schema
const studentSchema = new mongoose.Schema({
  fullName: String,
  className: String,
  enrollmentNo: String,
  dob: String,
  address: String,
  mobileNo: String,
  image: String,
});

const Student = mongoose.model('Student', studentSchema);



app.use(bodyParser.json());


// Add Student Route (POST)
app.post('/addstudent', async (req, res) => {
  const {
    fullName,
    className,
    enrollmentNo,
    dob,
    address,
    mobileNo,
    image,
  } = req.body;
  // console.log(fullName, className, enrollmentNo, dob, address, mobileNo, image);


  try {
const existingStudent = await Student.findOne({ enrollmentNo });
if (existingStudent) {
  return res.status(400).json({ error: 'Student already exists' });
}

    const newStudent = new Student({
      fullName,
      className,
      enrollmentNo,
      dob,
      address,
      mobileNo,
      image,
    });

    const savedStudent = await newStudent.save();

// const studentWithoutIdAndVersion = {
//   fullName : savedStudent.fullName,
//   className : savedStudent.className,
//   enrollmentNo : savedStudent.enrollmentNo,
//   dob : savedStudent.dob,
//   address : savedStudent.address,
//   mobileNo : savedStudent.mobileNo,
//   image : savedStudent.image,
// };

    // console.log(savedStudent);
    const std ={
      fullName : savedStudent.fullName,
      className : savedStudent.className,
      enrollmentNo : savedStudent.enrollmentNo,
      dob : savedStudent.dob,
      address : savedStudent.address,
      mobileNo : savedStudent.mobileNo,
      image : savedStudent.image,

    }

    // console.log(std);

    res.json(std);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/getStudent/:enrollmentNo', authenticateToken,async (req, res) => {
  const enrollmentNo = req.params.enrollmentNo;

  try {
    const student = await Student.findOne({ enrollmentNo });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      fullName: student.fullName,
      className: student.className,
      dob: student.dob,
      address: student.address,
      mobileNo: student.mobileNo,
      image: student.image
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.delete('/deletestudent/:enrollmentNo',  async (req, res) => {
  const enrollmentNo = req.params.enrollmentNo;
  console.log(enrollmentNo);

  try {
      // Assuming you have a Student model
      const student = await Student.findOneAndDelete({ enrollmentNo });

      if (!student) {
          return res.status(404).json({ message: 'Student not found' });
      }

      res.status(200).json({ message: 'Student deleted successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.put('/updatestudent/:enrollmentNo', async (req, res) => {
  const enrollmentNo = req.params.enrollmentNo;
  console.log(enrollmentNo);
  console.log(req.body);

  try {
    // Find the student by enrollmentNo
    const student = await Student.findOne({ enrollmentNo });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student details based on the request body
    student.fullName = req.body.fullName || student.fullName;
    student.enrollmentNo = req.body.enrollmentNo || student.enrollmentNo;
    student.className = req.body.className || student.className;
    student.dob = req.body.dob || student.dob;
    student.address = req.body.address || student.address;
    student.mobileNo = req.body.mobileNo || student.mobileNo;
    student.image = req.body.image || student.image;

    // Save the updated student
    const updatedStudent = await student.save();

    res.json({
      message: 'Student updated successfully',
      updatedStudent: {
        fullName: updatedStudent.fullName,
        enrollmentNo: updatedStudent.enrollmentNo,
        className: updatedStudent.className,
        dob: updatedStudent.dob,
        address: updatedStudent.address,
        mobileNo: updatedStudent.mobileNo,
        image: updatedStudent.image
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password ,name} = req.body;
  console.log(username, password,name);

  try {
    // Hash the password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Save the user to the database
    const user = new User({ username: username, password: password, name: name });
    await user.save();
    // res.status(201);
    res.json({ message: 'User registered successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);

  try {
    // Find the user by username
    const user = await User.findOne({ username });
    const token = "fac"+jwt.sign({ username: user.username }, 'your-secret-key');


    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = password === user.password;

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create and send a JWT token for successful login
    console.log(token);
    res.json({ token ,enroll:"123",name:user.name}); 
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/loginstd', async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);

  try {
    // Find the user by username
    const user = await Student.findOne({ enrollmentNo: username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = password === user.dob;

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create and send a JWT token for successful login
    const token = "std"+jwt.sign({ username: user.enrollmentNo }, 'your-secret-key');
    console.log(token);
    res.json({ token, enroll:username,name:user.fullName });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





app.get('/', (req, res) => {
  res.send('Hello World!');
})


app.get('/validatetoken', authenticateToken, (req, res) => {
  res.json({ message: 'You have access to this protected route', user: req.user });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
