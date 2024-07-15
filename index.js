const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
// const bcrypt = require('bcrypt');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
let { checkToken } = require('./auth/token_validation');
const fs = require('fs');
const { type } = require('os');
const app = express();
const cors=require('cors');
const moment = require('moment');
// const PDFDocument = require('pdfkit');

//const port = 5000;

//app.use(bodyParser.json());
const port = 5000 || process.env.PORT;

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root12",
  database: "medshyne_pro"
});

con.connect(err => {
    if (err) {
      console.error('Error connecting to the database:', err);
      return;
    }
    console.log('Connected to the database');
  });


app.use(express.json({limit: '200mb'}));
app.use(express.urlencoded({limit: '200mb', extended: true, parameterLimit:50000}));

app.use(cors());

const convertImageToBase64new = (filename, imageType = 'png' ) => {
  try{
    const buffer = fs.readFileSync(filename);
    const base64String = Buffer.from(buffer).toString('base64');
    return `data:image/${imageType};base64,${base64String}`;
  } catch (error) {
    throw new Error (`file ${filename} no exist`)
  }
}

// Doctor Module Backend Start By Patchaiyappan



//without hased password
app.post('/doctor_createaccount', async (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {
      doctor_name, dob, email, mobile_no, gender, address,
      state, pincode, otp, license_number, dr_bachelor, dr_master, dr_specialization,
      work_experience, user_name, password, document_upload, image_upload
    } = req.body;

    const documentBase64 = null;
    const imageBase64 = null;
    
    // Format DOB from dd-mm-yyyy to yyyy-mm-dd
    const formattedDob = dob.split('-').reverse().join('-');
    
    // Convert gender value to string
    const genderValue = gender === 1 ? "male" : "female";

    // Database query
    const query = `
      INSERT INTO tbldoctor 
      (doctor_name, dob, email, mobile_no, gender, address, state, pincode, otp, license_number, 
      dr_bachelor, dr_master, dr_specialization, work_experience, document_upload, image_upload, user_name, password) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      doctor_name, formattedDob, email, mobile_no, genderValue, address, state, pincode, otp, license_number, 
      dr_bachelor, dr_master, dr_specialization, work_experience, documentBase64, imageBase64, user_name, password
    ];

    con.query(query, values, function (err, result) {
        if (err) {
          console.error('Error inserting record:', err);
          res.status(500).json({
            Result: "Failure",
            message: "Error inserting record"
          });
        } else {
          console.log("1 record inserted");
          res.status(201).json({
            Result: "Success",
            message: "Doctor Data Inserted Successfully",
            result
          });
        }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});


// view doctor
app.get('/viewgender',  (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {doctor_id}= req.query; 

    const sql = `
      SELECT gender
      FROM tbldoctor
      WHERE doctor_id = ?
    `;

    // Use a separate database module to handle connections
    con.query(sql, [doctor_id], function (err, result) {
      if (err) {
        console.error('Error retrieving doctor details:', err);
        return res.status(500).json({
          Result: "Failure",
          message: "Error retrieving doctor details",
          error: err.message
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          Result: "Failure",
          message: "Doctor not found"
        });
      }

      // Modify the gender field based on the value (0 or 1)
      const modifiedResult = {
        doctorDetails: {
          gender: result[0].gender === 0 ? 'female' : 'male'
        }
      };

      res.status(200).json({
        Result: "Success",
        message: "Doctor Details Retrieved Successfully",
        doctorDetails: modifiedResult.doctorDetails 
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});


// Endpoint to retrieve or search for bachelor degree information
app.get('/dr_bachelor', (req, res) => {
  res.header('Content-Type', 'application/json');

  const { keyword } = req.query;

  let query;
  let queryParams = [];

  if (keyword) {
    query = `
      SELECT dr_bachelor FROM tblbachelor
      WHERE dr_bachelor LIKE ?;
    `;
    queryParams = [`%${keyword}%`];
  } else {
    query = `
      SELECT dr_bachelor FROM tblbachelor;
    `;
  }

  con.query(query, queryParams, (err, result) => {
    if (err) {
      console.error('Error executing bachelor query:', err);
      return res.status(500).json({
        Result: 'Failure',
        message: 'Error executing bachelor query. Please try again later.'
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        Result: 'Failure',
        message: 'No results found for the search query.'
      });
    }

    const bachelorList = result.map(record => record.dr_bachelor);

    console.log('Retrieved bachelor records');
    res.status(200).json({
      Result: 'Success',
      message: keyword ? 'Bachelor Data Retrieved Successfully' : 'All Bachelor Data Retrieved Successfully',
      data: bachelorList
    });
  });
});


// Endpoint to retrieve DropDown Specialization information
app.get('/dr_specialization', (req, res) => {
  res.header('Content-Type', 'application/json');

  const { keyword } = req.query;

  let query;
  let queryParams = [];

  if (keyword) {
    query = `
      SELECT dr_specialization FROM tblspecialization
      WHERE dr_specialization LIKE ?;
    `;
    queryParams = [`%${keyword}%`];
  } else {
    query = `
      SELECT dr_specialization FROM tblspecialization;
    `;
  }

  con.query(query, queryParams, (err, result) => {
    if (err) {
      console.error('Error executing specialization query:', err);
      return res.status(500).json({
        Result: 'Failure',
        message: 'Error executing specialization query. Please try again later.'
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        Result: 'Failure',
        message: 'No results found for the search query.'
      });
    }

    const specializationList = result.map(record => record.dr_specialization);

    console.log('Retrieved specialization records');
    res.status(200).json({
      Result: 'Success',
      message: keyword ? 'Specialization Data Retrieved Successfully' : 'All Specialization Data Retrieved Successfully',
      data: specializationList
    });
  });
});


// Endpoint to retrieve DropDown Master information
app.get('/dr_master', (req, res) => {
  res.header('Content-Type', 'application/json');

  const { keyword } = req.query;

  let query;
  let queryParams = [];

  if (keyword) {
    query = `
      SELECT dr_master FROM tblmaster
      WHERE dr_master LIKE ?;
    `;
    queryParams = [`%${keyword}%`];
  } else {
    query = `
      SELECT dr_master FROM tblmaster;
    `;
  }

  con.query(query, queryParams, (err, result) => {
    if (err) {
      console.error('Error executing master query:', err);
      return res.status(500).json({
        Result: 'Failure',
        message: 'Error executing master query. Please try again later.'
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        Result: 'Failure',
        message: 'No results found for the search query.'
      });
    }

    const masterList = result.map(record => record.dr_master);

    console.log('Retrieved master records');
    res.status(200).json({
      Result: 'Success',
      message: keyword ? 'Master Data Retrieved Successfully' : 'All Master Data Retrieved Successfully',
      data: masterList
    });
  });
});


//without hased password & token
app.post('/doctor_login', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { user_name, password } = req.body;

    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      const sql = `
        SELECT * FROM tbldoctor 
        WHERE user_name = ?
      `;

      con.query(
        sql,
        [user_name],
        function (err, result) {
          if (err) throw err;

          if (result.length > 0) {
            if (password === result[0].password) {
              // Successful login
              const doctorName = result[0].doctor_name; 

              res.status(200).json({
                Result: "Success",
                message: "Login Successful",
                doctor_name: doctorName
              });
            } else {
              // Invalid credentials
              res.status(401).json({
                Result: "Failure",
                message: "Invalid credentials. Please check your username and password."
              });
            }
          } else {
            // Invalid credentials
            res.status(401).json({
              Result: "Failure",
              message: "Invalid credentials. Please check your username and password."
            });
          }
        }
      );
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});


//OTP Authentication
const accountSids = process.env.TWILIO_ACCOUNT_SID || 'ACcf814164287980265667516608715b0a';
const authTokens = process.env.TWILIO_AUTH_TOKEN || 'c5d56bee8efdf2fad9cab0a4f175e298';
const twilioPhoneNumbers = process.env.TWILIO_PHONE_NUMBER || '+17637629677';
const clients= twilio(accountSids, authTokens);



// app.use(bodyParser.json());
app.use(session({
  secret: '605001',
  resave: false,
  saveUninitialized: false
}));

const generatesOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Check if mobile number exists in the database
function checkMobileNumberExistes(mobile_no) {
  return new Promise((resolve, reject) => {
    con.query('SELECT * FROM tbldoctor WHERE mobile_no = ?', [mobile_no], (err, results) => {
      if (err) {
        console.error('Error checking mobile number in database:', err);
        reject(err);
      } else {
        console.log('Results from database:', results);
        resolve(results.length > 0);
      }
    });
  });
}

// Send OTP via SMS
function sendOTP(mobile_no, otp) {
  return clients.messages.create({
    body: `Your OTP for login is: ${otp}`,
    from: twilioPhoneNumbers,
    to: mobile_no
  });
}

// Login using mobile number
app.post('/sentotp', async (req, res) => {
  const { mobile_no } = req.body;

  try {
    const mobileExists = await checkMobileNumberExistes(mobile_no);

    const otp = generatesOTP();
    req.session.otp = otp;
    req.session.mobileNo = mobile_no;

    if (mobileExists) {
      // Update the existing record with the new OTP
      con.query('UPDATE tbldoctor SET otp = ? WHERE mobile_no = ?', [otp, mobile_no], (updateErr, updateResult) => {
        if (updateErr) {
          console.error('Error updating OTP in database:', updateErr);
          res.status(500).json({ success: false, error: 'Failed to update OTP in the database' });
        } else {
          console.log('OTP updated in the database:', updateResult);
          sendOTP(mobile_no, otp)
            .then(message => {
              console.log(`OTP sent to ${mobile_no}: ${otp}`);
              res.json({ success: true, message: 'OTP sent successfully' });
            })
            .catch(error => {
              console.error('Error sending OTP:', error);
              res.status(500).json({ success: false, error: 'Failed to send OTP' });
            });
        }
      });
    } else {
      // Handle the case where the mobile number is not registered
      res.json({ success: false, error: 'Mobile number not registered' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Verify OTP
app.post('/verify', (req, res) => {
  res.header('Content-Type', 'application/json');
  
  try {
    const { otp, mobile_no } = req.body;
    console.log("otp: ", otp);
    console.log("Mobileno: ", mobile_no);

    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      var sql = 'SELECT otp FROM tbldoctor WHERE mobile_no = ?';
      con.query(sql, [mobile_no], function (err, result) {
        if (err) {
          console.error('Error executing SQL query:', err);
          throw err;
        }

        console.log("Record retrieved:", result);
        const savedOTP = result[0]?.otp; 
        console.log("Saved OTP:", savedOTP);

        if (otp === savedOTP) {
          // OTP verification successful
          res.json({ success: true, message: 'Verification successful' });
        } else {
          res.status(401).json({ success: false, message: 'Invalid OTP' });
        }
      });
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});


//patient profile
app.get('/patientprofile', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {consult_id} = req.query;

    // Check if studentId is provided
    if (!consult_id) {
      return res.status(400).json({
        result: "failure",
        message: "Please provide a valid studentId"
      });
    }

    const specificStudentQuery = `
      SELECT s.profile, ct.consult_id,  s.name,  DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),s.dob)), '%Y') + 0 AS age, 
      CONCAT(s.classes, '/', s.division) AS class_division, 
      c.department, s.gender, s.blood_group, s.allergies_define, s.any_disease_define,
      s.address,s.state, s.pincode, father.parent_name AS father_name, father.mobile_number AS father_mobile_number,
      mother.parent_name AS mother_name, mother.mobile_number AS mother_mobile_number
      FROM tblstudent s
      INNER JOIN tblconsulting ct ON s.id_number = ct.id_number
      LEFT JOIN tblparent father ON s.id_number = father.id_number AND father.relation = 'father'
      LEFT JOIN tblparent mother ON s.id_number = mother.id_number AND mother.relation = 'mother'
      LEFT JOIN tblclasses c ON s.id_number = c.id_number
      WHERE ct.consult_id = ?;
    `;
 
    const specificStaffQuery = `
    SELECT st.profile, ct.consult_id, st.name,st.designation, DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),st.dob)), '%Y') + 0 AS age, 
    st.gender, st.blood_group, st.allergies_define, st.any_disease_define,st.address,st.state, st.pincode, st.mobile_number
    FROM tblstaff st
    INNER JOIN tblconsulting ct ON st.id_number = ct.id_number
    WHERE ct.consult_id = ?;
    `;

    // First, check in tblstudent
    con.query(specificStudentQuery, [consult_id], function (err, result) {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.length > 0) {
        console.log("Retrieved specific student record with parent information");
        return res.status(200).json({
          result: "success",
          message: "Specific Student Data Retrieved Successfully",
          data: result[0]  
        });
      } else {
        // If not found in tblstudent, check tblstaff
        con.query(specificStaffQuery, [consult_id], function (staffErr, staffResult) {
          if (staffErr) {
            console.error('Error:', staffErr);
            return res.status(500).json({
              result: "failure",
              message: "Internal Server Error"
            });
          }

          if (staffResult.length > 0) {
            console.log("Retrieved specific staff record");
            return res.status(200).json({
              result: "success",
              message: "Staff Data Retrieved Successfully",
              data: staffResult[0]  
            });
          } else {
            return res.status(404).json({
              result: "failure",
              message: "Record not found in both student and staff records"
            });
          }
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Current Health Report
app.get('/currenthealthreport',  (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {consult_id} = req.query;

    // Check if id_number is provided
    if (!consult_id) {
      return res.status(400).json({
        result: "failure",
        message: "Please provide a valid consult_id"
      });
    }

    const CurrentHealthReportQuery = `
      SELECT s.current_health_report 
      FROM tblstudent s
      INNER JOIN tblconsulting ct ON s.id_number = ct.id_number
      WHERE ct.consult_id = ?;
    `;

    con.query(CurrentHealthReportQuery, [consult_id], function (err, result) {
      if (err) {
        console.error('Database Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.length > 0) {
        console.log("Retrieved Current Health Report for student with ID: ", consult_id);
        res.status(200).json({
          result: "success",
          message: "Current Health Report Retrieved Successfully",
          data: result[0]  
        });
      } else {
        // Check in tblstaff if student is not found
        const StaffHealthReportQuery = `
          SELECT st.current_health_report
          FROM tblstaff st
          INNER JOIN tblconsulting ct ON st.id_number = ct.id_number
          WHERE ct.consult_id = ?;
        `;
        con.query(StaffHealthReportQuery, [consult_id], function (staffErr, staffResult) {
          if (staffErr) {
            console.error('Database Error:', staffErr);
            return res.status(500).json({
              result: "failure",
              message: "Internal Server Error"
            });
          }

          if (staffResult.length > 0) {
            console.log("Retrieved Current Health Report for staff with ID: ", consult_id);
            res.status(200).json({
              result: "success",
              message: "Current Health Report Retrieved Successfully",
              data: staffResult[0]  
            });
          } else {
            res.status(404).json({
              result: "failure",
              message: "Student or Staff not found"
            });
          }
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// past Health Report
app.get('/pasthealthreport', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {consult_id} = req.query;

    // Check if id_number is provided
    if (!consult_id) {
      return res.status(400).json({
        result: "failure",
        message: "Please provide a valid consult_id"
      });
    }

    const StudentQuery = `
      SELECT s.past_health_report
      FROM tblstudent s
      INNER JOIN tblconsulting ct ON s.id_number = ct.id_number
      WHERE ct.consult_id = ?;
    `;

    const StaffQuery = `
      SELECT st.past_health_report
      FROM tblstaff st
      INNER JOIN tblconsulting ct ON st.id_number = ct.id_number
      WHERE ct.consult_id = ?;
    `;

    con.query(StudentQuery, [consult_id], function (err, studentResult) {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (studentResult.length > 0) {
        console.log("Retrieved Past Health Report from student record");
        return res.status(200).json({
          result: "success",
          message: "Past Health Report Retrieved Successfully",
          data: studentResult[0] 
        });
      } else {
        // If not found in student table, check staff table
        con.query(StaffQuery, [consult_id], function (err, staffResult) {
          if (err) {
            console.error('Error:', err);
            return res.status(500).json({
              result: "failure",
              message: "Internal Server Error"
            });
          }

          if (staffResult.length > 0) {
            console.log("Retrieved Past Health Report from staff record");
            return res.status(200).json({
              result: "success",
              message: "Past Health Report Retrieved Successfully",
              data: staffResult[0] 
            });
          } else {
            return res.status(404).json({
              result: "failure",
              message: "Record not found in both student and staff tables"
            });
          }
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


//appointment details view 
app.get('/appointmentdetails', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {consult_id} = req.query;
    console.log(consult_id);

    // Check if consult_id is provided
    if (!consult_id) {
      return res.status(400).json({
        result: "failure",
        message: "Please provide a valid consult_id"
      });
    }

    // Check database connection
    if (!con) {
      console.error('Database connection error');
      return res.status(500).json({
        result: "failure",
        message: "Database connection error"
      });
    }

    const studentQuery = `
      SELECT s.profile, ct.consult_id, ct.patient_name, ct.sick_type, ct.health_problem AS about_sick,
      DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), s.dob)), '%Y') + 0 AS age, s.classes, s.division,
      DATE_FORMAT(ct.from_time, '%h:%i %p') AS starting_time, c.department, s.gender, s.blood_group,
      s.allergies_define, s.any_disease_define, s.address, s.state, s.pincode, father.parent_name AS father_name, 
      father.mobile_number AS father_mobile_number, mother.parent_name AS mother_name, 
      mother.mobile_number AS mother_mobile_number
      FROM tblstudent s
      LEFT JOIN tblparent father ON s.id_number = father.id_number AND father.relation = 'father'
      LEFT JOIN tblparent mother ON s.id_number = mother.id_number AND mother.relation = 'mother'
      LEFT JOIN tblclasses c ON s.id_number = c.id_number
      INNER JOIN tblconsulting ct ON s.id_number = ct.id_number
      WHERE ct.consult_id = ?;
    `;

    const staffQuery = `
      SELECT st.profile, ct.consult_id, ct.patient_name, ct.sick_type, ct.health_problem AS about_sick,
      st.designation, DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), st.dob)), '%Y') + 0 AS age,
      DATE_FORMAT(ct.from_time, '%h:%i %p') AS starting_time, st.gender, st.blood_group,
      st.allergies_define, st.any_disease_define, st.address, st.state, st.pincode,
      st.mobile_number
      FROM tblstaff st
      INNER JOIN tblconsulting ct ON st.id_number = ct.id_number
      WHERE ct.consult_id = ?;
    `;

    // Execute studentQuery
    con.query(studentQuery, [consult_id], function (err, studentResult) {
      if (err) {
        console.error('Database Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (studentResult.length > 0) {
        console.log("Retrieved appointment details for the student");
        return res.status(200).json({
          result: "success",
          message: "Appointment Details Retrieved Successfully",
          data: studentResult
        });
      }

      // If appointment details not found for student, execute staffQuery
      con.query(staffQuery, [consult_id], function (err, staffResult) {
        if (err) {
          console.error('Database Error:', err);
          return res.status(500).json({
            result: "failure",
            message: "Internal Server Error"
          });
        }

        if (staffResult.length > 0) {
          console.log("Retrieved appointment details for the staff");
          return res.status(200).json({
            result: "success",
            message: "Appointment Details Retrieved Successfully",
            data: staffResult
          });
        }

        console.log("No appointments found for the student or staff");
        return res.status(404).json({
          result: "failure",
          message: "No appointments found for the student or staff"
        });
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint to retrieve consulting details
app.get('/consultingdetails', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {consult_id}  = req.query; 

    // Check if id_number is provided
    if (!consult_id) {
      return res.status(400).json({
        result: "failure",
        message: "Please provide a valid consult_id"
      });
    }

    // Query for tblstudent
    const studentQuery = `
      SELECT tblstudent.profile, tblconsulting.consult_id,
             tblconsulting.patient_name, tblconsulting.classes, 
             CONCAT(DATE_FORMAT(tblconsulting.date, '%d-%m-%y'),'  ', 
                    DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), '-', 
                    DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')) AS date_time, 
             tblconsulting.sick_type, tblconsulting.health_problem AS about_sick,
             TIMESTAMPDIFF(YEAR, tblstudent.dob, CURDATE()) AS age
      FROM tblconsulting 
      INNER JOIN tblstudent ON tblconsulting.id_number = tblstudent.id_number
      WHERE tblconsulting.consult_id = ?;
    `;

    // Query for tblstaff
    const staffQuery = `
      SELECT tblstaff.profile, tblconsulting.consult_id,
             tblconsulting.patient_name, tblconsulting.classes,
             CONCAT(DATE_FORMAT(tblconsulting.date, '%d-%m-%y'),'  ', 
                    DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), '-', 
                    DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')) AS date_time, 
             tblconsulting.sick_type, tblconsulting.health_problem AS about_sick,
             TIMESTAMPDIFF(YEAR, tblstaff.dob, CURDATE()) AS age
      FROM tblconsulting 
      INNER JOIN tblstaff ON tblconsulting.id_number = tblstaff.id_number
      WHERE tblconsulting.consult_id = ?;
    `;

    con.query(studentQuery, [consult_id], function (err, studentResult) {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (studentResult.length > 0) {
        console.log("Retrieved consulting details for the student");
        return res.status(200).json({
          result: "success",
          message: "Consulting Details Retrieved Successfully",
          data: studentResult  
        });
      } else {
        // If no result found in tblstudent, query tblstaff
        con.query(staffQuery, [consult_id], function (err, staffResult) {
          if (err) {
            console.error('Error:', err);
            return res.status(500).json({
              result: "failure",
              message: "Internal Server Error"
            });
          }

          if (staffResult.length > 0) {
            console.log("Retrieved consulting details for the staff");
            return res.status(200).json({
              result: "success",
              message: "Consulting Details Retrieved Successfully",
              data: staffResult  
            });
          } else {
            return res.status(404).json({
              result: "failure",
              message: "No consulting found for the student or staff"
            });
          }
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint to retrieve consulting video details
app.get('/consultvideo', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const consultId = req.query.consult_id;

    if (!consultId) {
      return res.status(400).json({
        result: "failure",
        message: "Please provide a valid consult_id"
      });
    }

    const studentQuery = `
      SELECT tblstudent.profile, tblconsulting.patient_name, tblstudent.organization_name,
      tblconsulting.id_number, tblconsulting.roles
      FROM tblconsulting 
      INNER JOIN tblstudent ON tblconsulting.id_number = tblstudent.id_number
      WHERE tblconsulting.consult_id = ?;
    `;

    const staffQuery = `
      SELECT tblstaff.profile, tblconsulting.patient_name, tblstaff.organization_name,
      tblconsulting.id_number, tblconsulting.roles
      FROM tblconsulting 
      INNER JOIN tblstaff ON tblconsulting.id_number = tblstaff.id_number
      WHERE tblconsulting.consult_id = ?;
    `;

    con.query(studentQuery, [consultId], function (err, studentResult) {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (studentResult.length > 0) {
        console.log("Retrieved consulting details for the student");
        return res.status(200).json({
          result: "success",
          message: "Consulting Details Retrieved Successfully",
          data: studentResult
        });
      } else {
        con.query(staffQuery, [consultId], function (err, staffResult) {
          if (err) {
            console.error('Error:', err);
            return res.status(500).json({
              result: "failure",
              message: "Internal Server Error"
            });
          }

          if (staffResult.length > 0) {
            console.log("Retrieved consulting details for the staff");
            return res.status(200).json({
              result: "success",
              message: "Consulting Details Retrieved Successfully",
              data: staffResult
            });
          } else {
            return res.status(404).json({
              result: "failure",
              message: "No consulting found for the student or staff"
            });
          }
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint for inserting prescription details
app.post('/insertprescription', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { medicine_detail, medicine_name, food } = req.body;

    // Check if required fields are provided
    if (!medicine_detail) {
      return res.status(400).json({
        result: 'failure',
        message: 'Please provide valid details'
      });
    }

    const insertPrescriptionQuery = 'INSERT INTO tblprescription (medicine_detail, medicine_name, food) VALUES (?, ?, ?)';

    con.query(insertPrescriptionQuery, [medicine_detail, medicine_name, food], (err, result) => {
      if (err) {
        console.error('Error inserting prescription details:', err);
        return res.status(500).json({
          result: 'failure',
          message: 'Internal Server Error'
        });
      }

      console.log('Prescription details inserted successfully');
      res.status(200).json({
        result: 'success',
        message: 'Prescription Details Inserted Successfully',
        data: result
      });
    });
  } catch (ex) {
    console.error('Exception:', ex);
    res.status(500).json({
      result: 'failure',
      message: 'Internal Server Error'
    });
  }
});

// Endpoint for inserting prescription details
app.post('/addprescriptiondetails', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    // Extract prescription details from request body
    const { prescription_id, consult_id, doctor_id, symptom, medicine_name, days, count, period, food } = req.body;

    // Check if all required fields are provided
    if (!prescription_id) {
      return res.status(400).json({
        result: 'failure',
        message: 'All fields are required'
      });
    }

    // Construct SQL query to insert prescription details
    const insertPrescriptionQuery = `
      INSERT INTO tblprescriptiondetails (prescription_id, consult_id, doctor_id, symptom, medicine_name, days, count, period, food)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the query to insert prescription details
    con.query(insertPrescriptionQuery, [prescription_id, consult_id, doctor_id, symptom, medicine_name, days, count, period, food], (err, result) => {
      if (err) {
        console.error('Error inserting prescription details:', err);
        return res.status(500).json({
          result: 'failure',
          message: 'Internal Server Error'
        });
      }

      console.log('Prescription details inserted successfully');
      res.status(200).json({
        result: 'success',
        message: 'Prescription Details Inserted Successfully',
        data: {
          prescription_id,
          consult_id, 
          doctor_id,
          symptom,
          medicine_name,
          days,
          count,
          period,
          food
        }
      });
    });
  } catch (ex) {
    console.error('Exception:', ex);
    res.status(500).json({
      result: 'failure',
      message: 'Internal Server Error'
    });
  }
});


// Endpoint for retrieving prescription details
app.get('/viewfood', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {prescription_id} = req.query;

    // Check if prescriptionId is provided
    if (!prescription_id) {
      return res.status(400).json({
        result: 'failure',
        message: 'Please provide a valid prescription ID'
      });
    }

    const getPrescriptionQuery = 'SELECT  food FROM tblprescription WHERE prescription_id = ?';

    con.query(getPrescriptionQuery, [prescription_id], (err, result) => {
      if (err) {
        console.error('Error retrieving prescription details:', err);
        return res.status(500).json({
          result: 'failure',
          message: 'Internal Server Error'
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          result: 'failure',
          message: 'Prescription not found'
        });
      }

      // Modify the food field based on the value (0 or 1)
      const modifiedResult = {
        medicine_detail: result[0].medicine_detail,
        medicine_name: result[0].medicine_name,
        food: result[0].food === 0 ? 'bf' : 'af'
      };

      res.status(200).json({
        result: 'success',
        message: 'Prescription Details Retrieved Successfully',
        data: modifiedResult
      });
    });
  } catch (ex) {
    console.error('Exception:', ex);
    res.status(500).json({
      result: 'failure',
      message: 'Internal Server Error'
    });
  }
});

// Endpoint to retrieve Dropdown symptom information
app.get('/symptom', (req, res) => {
  res.header('Content-Type', 'application/json');

  // Establish connection to the database
  con.connect(function(err) {
    if (err) {
      console.error('Error connecting to database:', err);
      res.status(500).json({
        Result: "Failure",
        message: "Error connecting to database"
      });
      return;
    }

    // Perform the query now that the connection is established
    const getAllSymptomsQuery = `
      SELECT symptom FROM tblsymptom
    `;

    con.query(getAllSymptomsQuery, function (err, result) {
      if (err) {
        console.error('Error querying database:', err);
        res.status(500).json({
          Result: "Failure",
          message: "Error querying database"
        });
        return;
      }

      const symptomList = result.map(record => record.symptom);

      console.log("Retrieved all symptom records");
      res.status(200).json({
        Result: "Success",
        message: "All Symptom Data Retrieved Successfully",
        data: symptomList
      });
    });
  });
});


// Endpoint to retrieve Dropdown days information
app.get('/days',   (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    con.connect(); 

    const getAllDaysQuery = `
      SELECT days FROM tbldays
    `;

    con.query(getAllDaysQuery, function (err, result) {
      if (err) throw err;

      const daysList = result.map(record => record.days);

      console.log("Retrieved all days records");
      res.status(200).json({
        Result: "Success",
        message: "All Days Data Retrieved Successfully",
        data: daysList
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  } 
  // finally {
  //   con.end(); 
  // }
});


// Endpoint to retrieve Dropdown period information
app.get('/period', async (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    con.connect(); 

    const getAllPeriodsQuery = `
      SELECT period FROM tblperiod
    `;

    con.query(getAllPeriodsQuery, function (err, result) {
      if (err) throw err;

      const periodList = result.map(record => record.period);

      console.log("Retrieved all period records");
      res.status(200).json({
        Result: "Success",
        message: "All Period Data Retrieved Successfully",
        data: periodList
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  } 

  // finally {
  //   con.end(); 
  // }
 
});


// Endpoint to retrieve Dropdown count information
app.get('/count',    (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    con.connect(); // Assuming 'con' is your MySQL connection object

    const getAllCountsQuery = `
      SELECT count FROM tblcount
    `;

    con.query(getAllCountsQuery, function (err, result) {
      if (err) throw err;

      const countList = result.map(record => record.count);

      console.log("Retrieved all count records");
      res.status(200).json({
        Result: "Success",
        message: "All Count Data Retrieved Successfully",
        data: countList
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  } 
});


// Define the route to retrieve status for completed & cancelled records
app.get('/consulting_register', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    // Assuming doctor_id is passed as a query parameter
    const {doctor_id} = req.query; 

    const StatusQuery = `
      SELECT 
        CASE
          WHEN tblstudent.id_number IS NOT NULL THEN tblstudent.profile
          ELSE tblstaff.profile
        END AS profile,
        tblconsulting.consult_id,
        tblconsulting.patient_name,
        tblconsulting.sick_type,
        tblconsulting.health_problem AS about_as,
        CONCAT(
          DATE_FORMAT(tblconsulting.date, '%d-%m-%y'),'  ', 
          DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), '-', 
          DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')
        ) AS date_time, 
        CASE
          WHEN tblstudent.dob IS NOT NULL THEN TIMESTAMPDIFF(YEAR, tblstudent.dob, CURDATE())
          ELSE TIMESTAMPDIFF(YEAR, tblstaff.dob, CURDATE())
        END AS age, 
        CASE
          WHEN tblstudent.classes IS NOT NULL THEN tblstudent.classes
          ELSE tblstaff.designation
        END AS class_designation,           
        tblconsulting.status
      FROM 
        tblconsulting
      LEFT JOIN 
        tblstudent ON tblconsulting.id_number = tblstudent.id_number
      LEFT JOIN 
        tblstaff ON tblconsulting.id_number = tblstaff.id_number
      LEFT JOIN 
        tbldoctor ON tbldoctor.doctor_id = tblconsulting.doctor_id
      WHERE 
        tblconsulting.status IN ('completed', 'cancelled')
        AND tbldoctor.doctor_id = ? 
      ORDER BY 
        tblconsulting.date DESC;
    `;

    con.query(StatusQuery, [doctor_id], (err, result) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.length > 0) {
        console.log("Retrieved Status for completed & cancelled records for doctor", doctor_id);

        res.status(200).json({
          result: "success",
          message: "Status Retrieved Successfully",
          data: result 
        });
      } else {
        res.status(404).json({
          result: "failure",
          message: `No records found for doctor ${doctor_id}`
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});



// Define the route to retrieve status for all "complete" records
app.get('/consulting_done', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    // Assuming doctor_id is passed as a query parameter
    const {doctor_id} = req.query; // Retrieve doctor_id from query parameter

    const DoneQuery = `
      SELECT 
        COALESCE(tblstudent.profile, tblstaff.profile) AS profile,
        tblconsulting.consult_id,
        tblconsulting.patient_name,
        tblconsulting.sick_type,
        tblconsulting.status,
        tblconsulting.health_problem AS about_as,
        CONCAT(
          DATE_FORMAT(tblconsulting.date, '%d-%m-%y'),'  ', 
          DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), '-', 
          DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')
        ) AS date_time, 
        CASE
          WHEN tblstudent.dob IS NOT NULL THEN TIMESTAMPDIFF(YEAR, tblstudent.dob, CURDATE())
          ELSE TIMESTAMPDIFF(YEAR, tblstaff.dob, CURDATE())
        END AS age, 
        CASE
          WHEN tblstudent.classes IS NOT NULL THEN tblstudent.classes
          ELSE tblstaff.designation
        END AS class_designation
      FROM 
        tblconsulting
      LEFT JOIN 
        tblstudent ON tblconsulting.id_number = tblstudent.id_number
      LEFT JOIN 
        tblstaff ON tblconsulting.id_number = tblstaff.id_number
      LEFT JOIN 
        tbldoctor ON tbldoctor.doctor_id = tblconsulting.doctor_id
      WHERE 
        tblconsulting.status = 'completed'
        AND tbldoctor.doctor_id = ? 
      ORDER BY 
        tblconsulting.date DESC;
    `;

    con.query(DoneQuery, [doctor_id], (err, result) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.length > 0) {
        console.log(`Retrieved Data for all 'complete' records for doctor ${doctor_id}`);

        res.status(200).json({
          result: "success",
          message: "Data Retrieved Successfully",
          data: result
        });
      } else {
        res.status(404).json({
          result: "failure",
          message: `No 'complete' records found for doctor ${doctor_id}`
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});

// Endpoint to insert records into tblavailable
app.post('/insert_availables', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { days, sub_bts } = req.body; 

    // Assuming status and master_bts_id are constant
    const status = 'Unavailable';
    const master_bts_id = 1;

    const InsertQuery = `
      INSERT INTO tblparent_available (days, sub_bts, status, master_bts_id)
      VALUES (?, ?, ?, ?)
    `;

    con.query(InsertQuery, [days, sub_bts, status, master_bts_id], function (err, result) {
      if (err) {
        console.error('Error executing insert query:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      console.log("Inserted record into tblavailable");

      res.status(201).json({
        result: "success",
        message: "Record Inserted Successfully"
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint to insert records into tblavailable
app.post('/insert_availables_ch', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { parent_available_id, from_time, to_time } = req.body; 



    const InsertQuery = `
      INSERT INTO tblchild_available (parent_available_id, from_time, to_time)
      VALUES (?, ?, ?)
    `;

    con.query(InsertQuery, [parent_available_id, from_time, to_time], function (err, result) {
      if (err) {
        console.error('Error executing insert query:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      console.log("Inserted record into tblavailable");

      res.status(201).json({
        result: "success",
        message: "Record Inserted Successfully"
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint to view available and unavailable time slots
app.get('/view_availables', (req, res) => {
  res.header('Content-Type', 'application/json');

  // Query to retrieve available time slots
  const AvailableQuery = `
    SELECT 
      CONCAT_WS('', 
        CASE WHEN tblparent_available.sub_bts = '1' THEN 'True' ELSE 'False' END
      ) AS available_time,
      tblparent_available.days,
      tblchild_available.from_time,
      tblchild_available.to_time,
      tblchild_available.child_available_id,
      tblmaster_bts.master_bts_id
    FROM tblparent_available
    INNER JOIN tbldoctor ON tblparent_available.doctor_id = tbldoctor.doctor_id
    INNER JOIN tblchild_available ON tblparent_available.parent_available_id = tblchild_available.parent_available_id
    LEFT JOIN tblmaster_bts ON tblparent_available.master_bts_id = tblmaster_bts.master_bts_id
    WHERE tblparent_available.sub_bts = 1
    AND (tblmaster_bts.master_bts IS NULL OR tblmaster_bts.master_bts = 1);
  `;

  // Query to retrieve unavailable time slots
  const UnavailableQuery = `
    SELECT 
    CASE 
    WHEN tblmaster_bts.master_bts = '1' AND tblparent_available.sub_bts = '0' THEN 'False' 
    WHEN tblmaster_bts.master_bts = '1' THEN 'True' 
    ELSE 'False' 
    END
    AS available_time,
    tblparent_available.days, 
    tblchild_available.child_available_id,
    tblmaster_bts.master_bts_id
    FROM 
      tblparent_available
    INNER JOIN 
      tblchild_available ON tblparent_available.parent_available_id = tblchild_available.parent_available_id
    JOIN 
      tblmaster_bts ON tblparent_available.master_bts_id = tblmaster_bts.master_bts_id
    WHERE 
      tblparent_available.sub_bts = 0 OR tblmaster_bts.master_bts = 0;
  `;

  // Execute the available query
  con.query(AvailableQuery, function (err, availableResult) {
    if (err) {
      console.error('Error executing AvailableQuery:', err);
      return res.status(500).json({
        result: "failure",
        message: "Internal Server Error"
      });
    }

    // Execute the unavailable query
    con.query(UnavailableQuery, function (err, unavailableResult) {
      if (err) {
        console.error('Error executing UnavailableQuery:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      // Combine available and unavailable slots by days
      const slotsByDay = {};

      // Process available slots
      availableResult.forEach(slot => {
        const { days, from_time, to_time, child_available_id, master_bts_id } = slot;
        if (!slotsByDay[days]) {
          slotsByDay[days] = {
            days,
            slots: [],
            available_time: slot.available_time,
            master_bts_id: slot.master_bts_id,
            from_times: [], // Array to hold from_times
            to_times: []   // Array to hold to_times
          };
        }
        slotsByDay[days].slots.push({
          child_available_id
        });
        // Push from_time and to_time into respective arrays
        slotsByDay[days].from_times.push(from_time);
        slotsByDay[days].to_times.push(to_time);
      });

      // Process unavailable slots
      unavailableResult.forEach(slot => {
        const { days, child_available_id, master_bts_id } = slot;
        if (!slotsByDay[days]) {
          slotsByDay[days] = {
            days,
            slots: [],
            available_time: slot.available_time,
            master_bts_id: slot.master_bts_id
          };
        }
        slotsByDay[days].slots.push({
          child_available_id
        });
      });

      // Convert object to array
      const responseData = {
        result: "success",
        message: "Data Retrieved Successfully",
        data: Object.values(slotsByDay)
      };

      res.json(responseData);
    });
  });
});


// Endpoint to retrieve DropDown Time information
app.get('/dr_time', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      const getAllTimeQuery = `
        SELECT time FROM tbltime
      `;

      con.query(getAllTimeQuery, function (err, result) {
        if (err) throw err;

        console.log("Retrieved all Time records");

        // Assuming result is an array of objects
        const timeList = result.map(item => item.time);

        res.status(200).json({
          Result: "Success",
          message: "All Time Data Retrieved Successfully",
          data: timeList
        });
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});


// Endpoint to select records from tblavailable
app.get('/view_time', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    // Get current day abbreviation
    const currentDay = moment().format('ddd').toUpperCase(); 

    const AvailableQuery = `
    SELECT DISTINCT tbldoctor.profile, tbldoctor.doctor_id, tbldoctor.doctor_name, tbldoctor.work_experience, tblparent_available.days, tblchild_available.from_time, tblchild_available.disable_bts, tblchild_available.child_available_id, CONCAT(tbldoctor.dr_bachelor, ', ', tbldoctor.dr_master) AS education
    FROM tblparent_available
    INNER JOIN tbldoctor ON tblparent_available.doctor_id = tbldoctor.doctor_id
    INNER JOIN tblchild_available ON tblparent_available.parent_available_id = tblchild_available.parent_available_id
    LEFT JOIN tblmaster_bts ON tblparent_available.master_bts_id = tblmaster_bts.master_bts_id
    WHERE tblparent_available.sub_bts = 1
    AND (tblmaster_bts.master_bts IS NULL OR tblmaster_bts.master_bts = 1)
    AND tblparent_available.days LIKE '%${currentDay}%';`;

    // Execute AvailableQuery
    con.query(AvailableQuery, function (err, doctorResult) {
      if (err) {
        console.error('Error executing AvailableQuery:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (doctorResult.length > 0) {
        console.log("Retrieved available records with unique doctor details");

        // Initialize arrays for doctor details and availability
        let doctorDetails = [];
        let availabilityDetails = [];
        let doctorIdsAdded = new Set(); // Set to track added doctor IDs

        // Populate doctor details and availability arrays
        doctorResult.forEach(doctor => {
          // Extract doctor details
          const {
            doctor_id,
            profile,
            doctor_name,
            work_experience,
            education
          } = doctor;

          // Extract availability details
          const availability = {
            day: doctor.days,
            from_time: doctor.from_time,
            child_available_id: doctor.child_available_id,
            disable_bts: doctor.disable_bts
          };

          // Push doctor details to the array if the doctor ID is not already added
          if (!doctorIdsAdded.has(doctor_id)) {
            doctorDetails.push({
              doctor_id,
              profile,
              doctor_name,
              work_experience,
              education
            });
            doctorIdsAdded.add(doctor_id); // Mark doctor ID as added
          }

          // Push availability details to the array
          availabilityDetails.push(availability);
        });

        // Send response with doctorDetails array if not empty
        if (doctorDetails.length > 0) {
          res.json({
            result: "success",
            message: "Available Time with Unique Doctor Details Retrieved Successfully",
            doctorDetails,
            availabilityDetails
          });
        } else {
          console.log("No available records found");
          res.json({
            result: "failure",
            message: "No available records found",
            doctorDetails: [],
            availabilityDetails: []
          });
        }
      } else {
        console.log("No available records found");
        res.json({
          result: "failure",
          message: "No available records found",
          doctorDetails: [],
          availabilityDetails: []
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// PUT endpoint to update view time
app.put('/update_view_time', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { disable_bts, child_available_id } = req.body;

    // Query to update the record
    const updateQuery = `UPDATE tblchild_available SET disable_bts = ? WHERE child_available_id = ?`;

    con.query(updateQuery, [disable_bts, child_available_id], function (err, result) {
      if (err) {
        console.error('Error executing update query:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.affectedRows === 0) {
        // No rows were updated, indicating the record doesn't exist
        return res.status(404).json({
          result: "failure",
          message: "Record not found"
        });
      }

      console.log("Updated record in tblchild_available");

      res.status(200).json({
        result: "success",
        message: "Record Updated Successfully"
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint to update records in tblch
app.put('/update_availables_ch', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { from_time, to_time } = req.body;
    const child_available_id = req.body.child_available_id; 

    const UpdateQuery = `
      UPDATE tblchild_available
      SET from_time = ?, to_time = ?
      WHERE child_available_id = ?
    `;

    con.query(UpdateQuery, [from_time, to_time, child_available_id], function (err, result) {
      if (err) {
        console.error('Error executing update query:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          result: "failure",
          message: "Record not found"
        });
      }

      console.log("Updated record in tblavailable");

      res.status(200).json({
        result: "success",
        message: "Record Updated Successfully"
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint to update records in tblch
app.put('/update_availables_ps', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { sub_bts } = req.body;
    const parent_available_id = req.body.parent_available_id; 

    const updateQuery = `
      UPDATE tblparent_available
      SET sub_bts = ?
      WHERE parent_available_id = ?
    `;

    con.query(updateQuery, [sub_bts, parent_available_id], function (err, result) {
      if (err) {
        console.error('Error executing update query:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          result: "failure",
          message: "Record not found"
        });
      }

      console.log("Updated record in tblps");

      res.status(200).json({
        result: "success",
        message: "Record Updated Successfully"
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint to update records in tblch
app.put('/update_availables_mts', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { master_bts } = req.body;
    const master_bts_id = req.body.master_bts_id; 

    const updateQuery = `
      UPDATE tblmaster_bts
      SET master_bts = ?
      WHERE master_bts_id = ?
    `;

    con.query(updateQuery, [master_bts, master_bts_id], function (err, result) {
      if (err) {
        console.error('Error executing update query:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          result: "failure",
          message: "Record not found"
        });
      }

      console.log("Updated record in tblps");

      res.status(200).json({
        result: "success",
        message: "Record Updated Successfully"
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint to delete records in tblch
app.delete('/delete_ch', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const child_available_id = req.body.child_available_id; 

    const deleteQuery = `
      DELETE FROM tblchild_available
      WHERE child_available_id = ?
    `;

    con.query(deleteQuery, [child_available_id], function (err, result) {
      if (err) {
        console.error('Error executing delete query:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          result: "failure",
          message: "Record not found"
        });
      }

      console.log("Deleted record from tblch");

      res.status(200).json({
        result: "success",
        message: "Record Deleted Successfully"
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint for viewing consulting prescription including student profile
app.get('/consulting_prescription', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    // Assuming doctor_id is passed as a query parameter
    const {doctor_id} = req.query; 

    let selectConsultingQuery = `
      SELECT 
        IFNULL(tblstudent.profile, tblstaff.profile) AS profile, 
        tblconsulting.patient_name, 
        tblconsulting.sick_type,
        tblconsulting.status,
        tblconsulting.health_problem AS about_as,
        CONCAT(
          DATE_FORMAT(tblconsulting.date, '%d-%m-%y'),'  ', 
          DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), '-', 
          DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')
        ) AS date_time, 
        CASE
          WHEN tblstudent.dob IS NOT NULL THEN TIMESTAMPDIFF(YEAR, tblstudent.dob, CURDATE())
          ELSE TIMESTAMPDIFF(YEAR, tblstaff.dob, CURDATE())
        END AS age, 
        CASE
          WHEN tblstudent.classes IS NOT NULL THEN tblstudent.classes
          ELSE tblstaff.designation
        END AS class_designation,
        tblconsulting.consult_id
      FROM 
        tblconsulting
      LEFT JOIN
        tblstudent ON tblconsulting.id_number = tblstudent.id_number
      LEFT JOIN
        tblstaff ON tblconsulting.id_number = tblstaff.id_number
      LEFT JOIN
        tblprescription ON tblconsulting.consult_id = tblprescription.consult_id
      INNER JOIN
        tbldoctor ON tbldoctor.doctor_id = tblconsulting.doctor_id
      WHERE
        tblconsulting.status = 'completed'
        AND tbldoctor.doctor_id = ?
        AND (tblstudent.id_number IS NOT NULL OR tblstaff.id_number IS NOT NULL)
      ORDER BY tblconsulting.date DESC
    `;

    con.query(selectConsultingQuery, [doctor_id], (err, result) => {
      if (err) {
        console.error('Error fetching consulting prescription:', err);
        return res.status(500).json({
          result: 'failure',
          message: 'Internal Server Error'
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          result: 'failure',
          message: 'Consulting prescription not found'
        });
      }

      console.log('Consulting prescription retrieved successfully');
      res.status(200).json({
        result: 'success',
        message: 'Consulting prescription Retrieved Successfully',
        data: result
      });
    });
  } catch (ex) {
    console.error('Exception:', ex);
    res.status(500).json({
      result: 'failure',
      message: 'Internal Server Error'
    });
  }
});



// Recent Consulting  view
app.get('/recent_consulting', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {doctor_id} = req.query; 

    const recentconsultingQuery = `
      SELECT 
        IFNULL(tblstudent.profile, tblstaff.profile) AS profile, 
        tblconsulting.patient_name,
        tblconsulting.sick_type,
        tblconsulting.consult_id,
        tblconsulting.health_problem AS about_sick,
        CONCAT(
          DATE_FORMAT(tblconsulting.date, '%d-%m-%y'),'  ', 
          DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), '-', 
          DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')
        ) AS date_time,
        CASE
          WHEN tblstudent.dob IS NOT NULL THEN TIMESTAMPDIFF(YEAR, tblstudent.dob, CURDATE())
          ELSE TIMESTAMPDIFF(YEAR, tblstaff.dob, CURDATE())
        END AS age, 
        CASE
          WHEN tblstudent.classes IS NOT NULL THEN tblstudent.classes
          ELSE tblstaff.designation
        END AS class_designation
      FROM 
        tblconsulting 
      LEFT JOIN 
        tblstudent ON tblconsulting.id_number = tblstudent.id_number
      LEFT JOIN 
        tblstaff ON tblconsulting.id_number = tblstaff.id_number
      LEFT JOIN 
        tbldoctor ON tbldoctor.doctor_id = tblconsulting.doctor_id
      WHERE 
        tblconsulting.date >= DATE_SUB(CURDATE(), INTERVAL 5 DAY)
        AND tblconsulting.status = 'completed'
        AND tbldoctor.doctor_id = ?; 
    `;

    con.query(recentconsultingQuery, [doctor_id], (err, result) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.length > 0) {
        console.log("Retrieved recent consulting for doctor",doctor_id);
        res.status(200).json({
          result: "success",
          message: "Recent Consulting Retrieved Successfully",
          data: result
        });
      } else {
        res.status(404).json({
          result: "failure",
          message: "No recent consulting found for doctor " + doctor_id
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Define the route to retrieve all appointment details
app.get('/all_appointment', (req, res) => {
  res.header('Content-Type', 'application/json');

  const {doctor_id} = req.query; 
  
  const allappointmentQuery = `
    SELECT 
        COALESCE(s.profile, st.profile) AS profile, 
        c.patient_name, 
        c.consult_id,
        c.from_time AS meet_at
    FROM tblconsulting c
    LEFT JOIN tblstudent s ON c.id_number = s.id_number
    LEFT JOIN tblstaff st ON c.id_number = st.id_number
    INNER JOIN tbldoctor d ON d.doctor_id = c.doctor_id
    WHERE c.status IN ('new', 'waiting')
      AND d.doctor_id = ?
    ORDER BY c.from_time;
  `;

  con.query(allappointmentQuery, [doctor_id], (err, result) => {
    if (err) {
      console.error('Database Error:', err);
      return res.status(500).json({
        result: "failure",
        message: "Internal Server Error"
      });
    }

    if (result.length > 0) {
      console.log("Retrieved all appointment details for doctor", doctor_id);
      res.status(200).json({
        result: "success",
        message: "All Appointment Details Retrieved Successfully",
        data: result
      });
    } else {
      console.log("No appointments found for doctor", doctor_id);
      res.status(404).json({
        result: "failure",
        message: "No appointments found"
      });
    }
  });
});


// Define the route to retrieve all consulting detail list
app.get('/consultingdetaillist', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {id_number} = req.query;
    const {roles} = req.query;

    // Check if id and role are provided
    if (!id_number || !roles) {
      return res.status(400).json({
        result: "failure",
        message: "Please provide a valid id and role"
      });
    }

    // Determine the appropriate query based on the role
    let consultingQuery = '';
    if (roles === 'student') {
      consultingQuery = `
        SELECT tblstudent.organization_name, tblconsulting.patient_name, tblstudent.profile, tblconsulting.sick_type, tblconsulting.consult_id, 
          DATE_FORMAT(tblconsulting.date, '%d-%m-%y') AS date,
          CONCAT(DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), ' - ', DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')) AS consultation_time
        FROM tblconsulting 
        INNER JOIN tblstudent ON tblconsulting.id_number = tblstudent.id_number
        WHERE tblconsulting.id_number = ? AND tblconsulting.roles = 'student'
        ORDER BY tblconsulting.date ASC; 
      `;
    } else if (roles === 'staff' || roles === 'HCR') {
      consultingQuery = `
        SELECT tblstaff.organization_name, tblconsulting.patient_name, tblstaff.profile, tblconsulting.sick_type, tblconsulting.consult_id, 
          DATE_FORMAT(tblconsulting.date, '%d-%m-%y') AS date,
          CONCAT(DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), ' - ', DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')) AS consultation_time
        FROM tblconsulting 
        INNER JOIN tblstaff ON tblconsulting.id_number = tblstaff.id_number
        WHERE tblconsulting.id_number = ? AND tblconsulting.roles IN ('staff', 'HCR')
        ORDER BY tblconsulting.date ASC; 
      `;
    } else {
      return res.status(400).json({
        result: "failure",
        message: "Invalid role provided"
      });
    }

    con.query(consultingQuery, [id_number], function (err, result) {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.length > 0) {
        console.log(`Retrieved past consulting details for the ${roles}`);

        // Extract organization_name and patient_name from the first row
        const { patient_name, organization_name } = result[0];

        // Remove organization_name and patient_name from each row
        const data = result.map(({ patient_name, organization_name, ...rest }) => rest);

        return res.status(200).json({
          result: "success",
          message: "Past Consulting Details Retrieved Successfully",
          patient_name,
          organization_name,
          data
        });
      } else {
        return res.status(404).json({
          result: "failure",
          message: `No consulting found for the provided id_number and role ${roles}`
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Retrieve Doctor Data
app.get('/viewdoctorprofile', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {doctor_id} = req.query;

    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      const sql = `
        SELECT doctor_id,doctor_name, email,  DATE_FORMAT(dob, '%d-%m-%y') AS dob, license_number, mobile_no,
               gender, work_experience, CONCAT(address, ', ', state, ', ', pincode) AS address, 
               CONCAT(dr_bachelor, ', ', dr_master) AS doctor_qualification,  dr_specialization
        FROM tbldoctor WHERE doctor_id = ?
      `;

      con.query(
        sql,
        [doctor_id],
        function (err, result) {
          if (err) throw err;
          console.log("Doctor profile retrieved:", result);
          res.status(200).json({
            Result: "Success",
            message: "Doctor Profile Retrieved Successfully",
            data: result
          });
        }
      );
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});

// Update Doctor Data
app.put('/updatedoctorprofile', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { doctor_id, doctor_name, email, dob, blood_group, gender, work_experience, address, state, pincode, dr_bachelor, dr_master, dr_specialization} = req.body;

    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      const sql = `
      UPDATE tbldoctor 
      SET doctor_name = ?, email = ?, dob = ?, blood_group = ?, gender = ?, work_experience = ?, address = ?, state = ?, pincode = ?, dr_bachelor = ?, dr_master = ?, dr_specialization = ?
      WHERE doctor_id = ?
      `;

      con.query(
        sql,
        [doctor_name, email, dob, blood_group, gender, work_experience, address, state, pincode, dr_bachelor, dr_master, dr_specialization, doctor_id],
        function (err, result) {
          if (err) throw err;
          console.log("Doctor data updated:", result);
          res.status(200).json({
            Result: "Success",
            message: "Doctor Profile Updated Successfully"
          });
        }
      );
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});


// // Update Doctor Image Data
app.put('/setdoctorprofile', (req, res) => {
  res.header('Content-Type', 'application/json');
  
    const { doctor_id, image_url } = req.body;
     try{
    var base64Image= null;
      con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");

        const sql = 
          `UPDATE tbldoctor 
          SET profile = ?
          WHERE doctor_id = ?`
        ;

        con.query(
          sql,
          [base64Image, doctor_id],
          function (err, result) {
            if (err) throw err;
            console.log("Doctor image updated:", result);
            res.status(200).json({
              Result: "Success",
              message: "Doctor Profile Image Updated Successfully"
            });
          }
        );
      });
    
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});


//Get User Name

app.get('/getusername',  (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {doctor_id} = req.query;

    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      const selectSql = `
        SELECT user_name FROM tbldoctor WHERE doctor_id = ?
      `;

      con.query(selectSql, [doctor_id], function (err, rows) {
        if (err) throw err;

        if (rows.length === 0) {
          // If no rows found, doctor_id doesn't exist
          return res.status(404).json({
            Result: "Failure",
            message: "Doctor ID not found"
          });
        }

        const user_name = rows[0].user_name; 

        res.status(200).json({
          Result: "Success",
          user_name: user_name
        });
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});



// without hased password
app.put('/forgotpassword', async (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const doctor_id = req.body.doctor_id;
    const password = req.body.password;

    // No need to hash the password when not using bcrypt
    const hashedPassword = password;

    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      const selectSql = `
        SELECT user_name FROM tbldoctor WHERE doctor_id = ?
      `;

      con.query(selectSql, [doctor_id], async function (err, rows) {
        if (err) throw err;

        if (rows.length === 0) {
          // If no rows found, doctor_id doesn't exist
          return res.status(404).json({
            Result: "Failure",
            message: "Doctor ID not found"
          });
        }

        const updateSql = `
          UPDATE tbldoctor
          SET password = ?
          WHERE doctor_id = ?
        `;

        con.query(
          updateSql,
          [hashedPassword, doctor_id],
          function (err, result) {
            if (err) throw err;
            console.log("Doctor password updated.");
            res.status(200).json({
              Result: "Success",
              message: "Doctor Password Updated Successfully"
            });
          }
        );
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});


// Route to handle appointment cancellation for Doctor
app.put('/appointment_cancelled', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { consult_id } = req.body;
    const status = 'cancelled';
    const reason = 'cancelled by Doctor';

    const sql = `
      UPDATE tblconsulting AS c
      INNER JOIN tblparent_available AS p ON c.doctor_id = p.doctor_id
      INNER JOIN tblchild_available AS ch ON p.parent_available_id = ch.parent_available_id
      SET c.status = ?, c.reason = ?, p.days = DAYNAME(c.date), ch.disable_bts = 0
      WHERE c.consult_id = ? AND c.from_time = ch.from_time;
    `;

    con.query(sql, [status, reason, consult_id], function(err, result) {
      if (err) {
        console.error('Appointment cancellation error:', err);
        res.status(500).json({
          Result: 'Failure',
          message: 'Appointment cancellation failed'
        });
      } else {
        console.log('Appointment Cancelled:', result);
        res.status(200).json({
          Result: 'Success',
          message: 'Appointment cancelled successfully'
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: 'Failure',
      message: ex.message
    });
  }
});



// Route to handle appointment cancellation for HCR
app.put('/update_status_cancel', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { consult_id } = req.body;
    const status = 'cancelled';
    const reason = 'cancelled by HCR';

    const sql = `
  UPDATE tblconsulting AS c
  INNER JOIN tblparent_available AS p ON c.doctor_id = p.doctor_id
  INNER JOIN tblchild_available AS ch ON p.parent_available_id = ch.parent_available_id
  SET c.status = ?, c.reason = ?, p.days = CASE WHEN p.days IS NULL OR p.days = '' THEN DAYNAME(c.date) ELSE p.days END, ch.disable_bts = 0
  WHERE c.consult_id = ? AND c.from_time = ch.from_time;
`;


    con.query(sql, [status, reason, consult_id], function(err, result) {
      if (err) {
        console.error('Appointment cancellation error:', err);
        res.status(500).json({
          Result: 'Failure',
          message: 'Appointment cancellation failed'
        });
      } else {
        console.log('Appointment Cancelled:', result);
        res.status(200).json({
          Result: 'Success',
          message: 'Appointment cancelled successfully'
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: 'Failure',
      message: ex.message
    });
  }
});


//Cancelled Reason
app.get('/cancelled_reason', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { consult_id } = req.query;

    if (!consult_id) {
      return res.status(400).json({
        Result: "Failure",
        message: "id_number is required in the request body"
      });
    }

    con.connect(function (err) {
      if (err) {
        console.error('Database connection error:', err);
        return res.status(500).json({
          Result: "Failure",
          message: "Database connection error"
        });
      }
      console.log("Connected!");

      const sql = `
        SELECT reason
        FROM tblconsulting 
        WHERE consult_id = ? AND status = 'cancelled'
      `;

      con.query(sql, [consult_id], function (err, result) {
        if (err) {
          console.error('Error retrieving reason:', err);
          return res.status(500).json({
            Result: "Failure",
            message: "Error retrieving reason"
          });
        }
        if (result.length === 0) {
          return res.status(404).json({
            Result: "Failure",
            message: "Appointment not found or not cancelled"
          });
        } else {
          const reason = result[0].reason;
          console.log("Reason:", reason);
          return res.status(200).json({
            Result: "Success",
            reason: reason
          });
        }
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    return res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});


// Route to handle appointment completed
app.put('/appointment_completed', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { consult_id } = req.body;
    const status = 'completed';

    con.connect(function (err) {
      if (err) {
        console.error('Database connection error:', err);
        throw err;
      }
      console.log("Connected!");

      const sql = `
      UPDATE tblconsulting 
      SET status = ?, 
      to_time = NOW()
      WHERE consult_id = ?
      `;

      con.query(
        sql,
        [status, consult_id ],
        function (err, result) {
          if (err) {
            console.error('Appointment completed error:', err);
            throw err;
          }
          console.log("Appointment Completed:", result);
          res.status(200).json({
            Result: "Success",
            message: "Appointment Completed Successfully"
          });
        }
      );
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});


// Route to handle appointment completed
app.put('/followback_completed', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { consult_id, follow_back } = req.body;
    const status = 'completed';

    con.connect(function (err) {
      if (err) {
        console.error('Database connection error:', err);
        throw err;
      }
      console.log("Connected!");

      const sql = `
      UPDATE tblconsulting 
      SET status = ?, follow_back =?,
      to_time = NOW()
      WHERE consult_id = ?
      `;

      con.query(
        sql,
        [status, follow_back, consult_id],
        function (err, result) {
          if (err) {
            console.error('Appointment completed error:', err);
            throw err;
          }
          console.log("Appointment Completed:", result);
          res.status(200).json({
            Result: "Success",
            message: "Appointment Completed Successfully"
          });
        }
      );
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});


//Endpoint for viewing prescription details part 2 by consult_id
app.get('/viewprescriptiondetails', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    // Check if consult_id is provided in the query parameters
    const {consult_id} = req.query; 

    // Construct SQL query to fetch prescription details with inner join
    let selectPrescriptionQuery = `
    SELECT DISTINCT
    COALESCE(s.profile, st.profile) AS profile,
    c.patient_name,
    c.id_number,
    IF(LENGTH(CONVERT(c.id_number, CHAR)) = 1, "Student", "Staff") AS 'Member',
    CASE 
        WHEN s.id_number IS NOT NULL THEN CONCAT(s.classes, '/', s.division)
        ELSE CONCAT(st.department, '/', st.designation)
    END AS class,
    CASE
        WHEN s.dob IS NOT NULL THEN s.dob
        ELSE st.dob
    END AS dob,
    DATEDIFF(CURRENT_DATE(), 
             CASE
                 WHEN s.dob IS NOT NULL THEN s.dob
                 ELSE st.dob
             END) / 365 AS age,
    c.consult_id,
    DATE_FORMAT(c.date, '%d-%m-%y') AS date,
    CONCAT(DATE_FORMAT(c.from_time, '%h:%i %p'), ' - ', DATE_FORMAT(c.to_time, '%h:%i %p')) AS time,
    c.hcr_name,
    c.assignee,
    c.sick_type,
    c.health_problem,
    p.medicine_detail,
    pd.medicine_name, 
    CONCAT_WS('-',
        CASE WHEN pd.period = 'morning' THEN '1' ELSE '0' END,
        CASE WHEN pd.period = 'afternoon' THEN '1' ELSE '0' END,
        CASE WHEN pd.period = 'evening' THEN '1' ELSE '0' END,
        CASE WHEN pd.period = 'night' THEN '1' ELSE '0' END
    ) AS periods,
    pd.symptom, 
    pd.days, 
    pd.food,
    pd.count
FROM 
    tblconsulting c
INNER JOIN 
    tblprescriptiondetails pd ON c.consult_id = pd.consult_id
LEFT JOIN 
    tblprescription p ON c.consult_id = p.consult_id
LEFT JOIN 
    tblstudent s ON c.id_number = s.id_number
LEFT JOIN 
    tblstaff st ON c.id_number = st.id_number`;

    // If consult_id is provided, filter by it
    if (consult_id) {
      selectPrescriptionQuery += ' WHERE c.consult_id = ?';
    }

    console.log('SQL Query:', selectPrescriptionQuery); 

    // Execute the query with consult_id if provided
    con.query(selectPrescriptionQuery, [consult_id], (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({
          result: 'failure',
          message: 'Internal Server Error'
        });
      }

      // Check if prescription details were found
      if (result.length === 0) {
        return res.status(404).json({
          result: 'failure',
          message: 'Prescription details not found'
        });
      }

      console.log('Prescription details retrieved successfully');

      const generalPrescriptionSet = new Set(); // Using a Set to ensure unique general prescription details
      const consultationDetailsSet = new Set(); // Using a Set to ensure unique consultation details
      const medicineDetailsSet = new Set(); // Using a Set to ensure unique medicine details

      result.forEach(row => {
        // Calculate age from date of birth
        const dob = new Date(row.dob);
        const ageDiffMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDiffMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        // Add general prescription details to the Set
        generalPrescriptionSet.add(JSON.stringify({
          profile: row.profile,
          patient_name: row.patient_name,
          id_number: row.id_number,
          class: row.class,
          age: age, 
          consult_id: row.consult_id,
          date: row.date,
          time: row.time,
          hcr_name: row.hcr_name,
          parent_mobile: row.parent_mobile,
          doctor_name: row.doctor_name,
          Member: row.Member,
        }));

        // Add consultation details to the Set
        consultationDetailsSet.add(JSON.stringify({
          sick_type: row.sick_type,
          health_problem: row.health_problem,
        }));

        // Add medicine details to the Set
        medicineDetailsSet.add(JSON.stringify({
          medicine_detail: row.medicine_detail,
          medicine_name: row.medicine_name,
          periods: row.periods,
          symptom: row.symptom,
          days: row.days,
          food: row.food,
          count: row.count,
        }));
      });

      // Convert Sets to Arrays
      const generalPrescriptionArray = Array.from(generalPrescriptionSet).map(JSON.parse);
      const genPresArray=[];
      let switched = false;
      for(let i=0;i<= generalPrescriptionArray.length-1;i++)
      {   
        if(generalPrescriptionArray.length ==1)
        {
          genPresArray.push(generalPrescriptionArray[i]);
          break;
        }
        if(switched)
        {
          switched= false;
          continue;
        }
        
        let lstIndex = generalPrescriptionArray.length-1;
        let j = i +1;
        if(generalPrescriptionArray[i].id_number==generalPrescriptionArray[j].id_number)
        {
          console.log('I is ',i , ' j is : ', j );
          genPresArray.push(generalPrescriptionArray[i]);
          switched= true;
        }
           
      }

      
      const consultationDetailsArray = Array.from(consultationDetailsSet).map(JSON.parse);
      const medicineDetailsArray = Array.from(medicineDetailsSet).map(JSON.parse);

      res.status(200).json({
        result: 'success',
        message: 'Prescription Details Retrieved Successfully',
       // general_prescription: generalPrescriptionArray,
       general_prescription: genPresArray,
        consultation_details: consultationDetailsArray,
        medicine_details: medicineDetailsArray
      });
    });


  } catch (ex) {
    console.error('Exception:', ex);
    res.status(500).json({
      result: 'failure',
      message: 'Internal Server Error'
    });
  }
});


// Endpoint to retrieve worksheet details with date and doctor_id filters
app.get('/worksheet', (req, res) => {
  try {
    res.header('Content-Type', 'application/json');

    let { startDate, endDate, doctor_id } = req.query;

    // Default startDate and endDate to current date if not provided
    if (!startDate || !endDate) {
      startDate = new Date().toISOString().split('T')[0]; // Current date
      endDate = startDate; // Default to the same day
    }

    // Constructing the SQL query with optional date and doctor_id filters
    let dateFilter = `AND DATE(tblconsulting.date) BETWEEN ? AND ?`;
    let doctorFilter = '';
    let queryParams = [startDate, endDate];

    if (doctor_id) {
      doctorFilter = `AND tblconsulting.doctor_id = ?`;
      queryParams.push(doctor_id);
    }

    const worksheetQuery = `
      SELECT COALESCE(tblstaff.profile, tblstudent.profile) AS profile,
       tblconsulting.status,
       tblconsulting.patient_name,
       tblconsulting.id_number,
       CONCAT(DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), '-', DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')) AS date_time
      FROM tblconsulting
      LEFT JOIN tblstaff ON tblconsulting.id_number = tblstaff.id_number
      LEFT JOIN tblstudent ON tblconsulting.id_number = tblstudent.id_number
      WHERE tblconsulting.status = 'completed'
      ${dateFilter}
      ${doctorFilter};
    `;

    console.log("Executing query:", worksheetQuery); // Debug: Print the SQL query
    console.log("Query parameters:", queryParams); // Debug: Print query parameters

    con.query(worksheetQuery, queryParams, function (err, worksheetResult) {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (worksheetResult.length > 0) {
        console.log("Retrieved consulting details for the worksheet");
        return res.status(200).json({
          result: "success",
          message: "Consulting worksheet details retrieved successfully",
          data: worksheetResult
        });
      } else {
        return res.status(404).json({
          result: "failure",
          message: "No consulting found for the worksheet"
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});


// Endpoint to retrieve DropDown Statistics Interval information
app.get('/dr_statistics_interval', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    con.connect(function (err) {
      if (err) throw err;
      console.log("Connected!");

      const getAllStatisticsQuery = 
      'SELECT `interval` FROM tblstatistics_dropdown';
      
      con.query(getAllStatisticsQuery, function (err, result) {
        if (err) throw err;

        console.log("Retrieved all Statistics Interval records");

        // Assuming result is an array of objects
        const intervalList = result.map(item => item.interval);

        res.status(200).json({
          Result: "Success",
          message: "All Time Data Retrieved Successfully",
          data: intervalList
        });
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      Result: "Failure",
      message: ex.message
    });
  }
});



// // Express Routes statistics
// app.get('/statistics', (req, res) => {
//   const {interval, doctor_id} = req.query;

//   // Check if the provided interval is valid
//   if (!['1week', '1month', '6months', '1year'].includes(interval)) {
//     res.status(400).json({ error: 'Invalid interval parameter. Supported intervals are: week, month, 6months, year.' });
//     return;
//   }

//    // Check if doctor_id is provided
//    if (!doctor_id) {
//      res.status(400).json({ error: 'doctor_id is required.' });
//      return;
//    }
   
//   // Define queries based on the selected interval
//   const queries = [];

//   switch (interval) {
//     case '1week':
//       const currentDate1w = moment();
//       const previousDate1w = moment().subtract(1, 'week');
//       queries.push(
//         { interval: 'Current Week', startDate: currentDate1w.clone().startOf('week'), endDate: currentDate1w.clone().endOf('week') },
//         { interval: 'Previous Week', startDate: previousDate1w.clone().startOf('week'), endDate: previousDate1w.clone().endOf('week') }
//       );
//       break;
//     case '1month':
//       const currentMonth1m = moment();
//       const previousMonth1m = moment().subtract(1, 'month');
//       queries.push(
//         { interval: 'Current Month', startDate: currentMonth1m.clone().startOf('month'), endDate: currentMonth1m.clone().endOf('month') },
//         { interval: 'Previous Month', startDate: previousMonth1m.clone().startOf('month'), endDate: previousMonth1m.clone().endOf('month') }
//       );
//       break;
//     case '6months':
//       const currentMonth6m = moment();
//       const previousMonth6m = moment().subtract(6, 'months');
//       queries.push(
//         { interval: 'Current 6 Months', startDate: currentMonth6m.clone().subtract(5, 'months').startOf('month'), endDate: currentMonth6m.clone().endOf('month') },
//         { interval: 'Previous 6 Months', startDate: previousMonth6m.clone().subtract(5, 'months').startOf('month'), endDate: previousMonth6m.clone().endOf('month') }
//       );
//       break;
//     case '1year':
//       const currentMonth1y = moment();
//       const previousMonth1y = moment().subtract(1, 'year');
//       queries.push(
//         { interval: 'Current Year', startDate: currentMonth1y.clone().startOf('year'), endDate: currentMonth1y.clone().endOf('year') },
//         { interval: 'Previous Year', startDate: previousMonth1y.clone().startOf('year'), endDate: previousMonth1y.clone().endOf('year') }
//       );
//       break;
//     default:
//       break;
//   }

//   const statistics = {};

//   // Execute queries
//   queries.forEach(query => {
//     const days = {};
//     const totalDays = query.endDate.diff(query.startDate, 'days') + 1; // Total days including the end date
//     const sql = `SELECT 
//         TIMESTAMPDIFF(MINUTE, tblconsulting.from_time, tblconsulting.to_time) AS minutes_spent,
//         DATE(tblconsulting.date) AS date
//       FROM tblconsulting 
//       LEFT JOIN tblstudent ON tblconsulting.id_number = tblstudent.id_number
//       LEFT JOIN tblstaff ON tblconsulting.id_number = tblstaff.id_number
//       LEFT JOIN tbldoctor ON tbldoctor.doctor_id = tblconsulting.doctor_id
//       WHERE tblconsulting.status = 'completed' 
//         AND tblconsulting.doctor_id = ? 
//         AND tblconsulting.date BETWEEN ? AND ?`;

//                 con.query(
//                   sql,
//                   [doctor_id, query.startDate.format("YYYY-MM-DD"), query.endDate.format("YYYY-MM-DD")],
//                   (err, results) => {
//                     if (err) {
//                       console.error('Error executing MySQL query:', err.stack);
//                       res.status(500).json({ error: 'Internal server error' });
//                       return;
//                     }

//       results.forEach(result => {
//         const date = moment(result.date).format('YYYY-MM-DD');
//         if (!days[date]) {
//           days[date] = {
//             totalMinutes: 0,
//             totalAvailableMinutes: 0,
//             percentage: 0
//           };
//         }
//         days[date].totalMinutes += result.minutes_spent;
//       });

//       // Calculate total available minutes for each day
//       for (let date = moment(query.startDate); date <= query.endDate; date = date.clone().add(1, 'days')) {
//         const dateString = date.format('YYYY-MM-DD');
//         if (!days[dateString]) {
//           days[dateString] = {
//             totalMinutes: 0,
//             totalAvailableMinutes: 0,
//             percentage: 0
//           };
//         }
//         days[dateString].totalAvailableMinutes = 1440; // Total minutes in a day
//       }

//       // Calculate percentage for each day
//       Object.keys(days).forEach(date => {
//         days[date].percentage = (days[date].totalMinutes / days[date].totalAvailableMinutes) * 100;
//       });

//       // Divide the statistics based on the requested interval
//       switch (interval) {
//       case '1week':
//       const dailyStatistics1w = {};
//       let dayCounter = 1;
//       Object.keys(days).forEach(date => {
//         const dayOfWeek = `Day ${dayCounter}`;
//         // Only store the percentage for each day
//         dailyStatistics1w[dayOfWeek] = days[date].percentage;
//         dayCounter++;
//       });
//       statistics[query.interval] = dailyStatistics1w;
//       break;
//       case '1month':
//       // Divide the statistics into weeks
//       const weeklyStatistics1m = {};
//       const startDate = query.startDate.clone(); // Clone the start date of the month
//       const endDate = query.endDate.clone(); // Clone the end date of the month
//       let weekNumber = 1;

//       while (startDate.isBefore(endDate)) {
//       const weekStart = startDate.clone().startOf('week');
//       const weekEnd = startDate.clone().endOf('week');

//       const weekLabel = `Week ${weekNumber}`;
//       let totalMinutes = 0;
//       let totalAvailableMinutes = 0;

//       for (let date = weekStart; date.isSameOrBefore(weekEnd); date.add(1, 'day')) {
//       const dateString = date.format('YYYY-MM-DD');
//       const dayData = days[dateString] || { totalMinutes: 0, totalAvailableMinutes: 1440, percentage: 0 };
//       totalMinutes += dayData.totalMinutes;
//       totalAvailableMinutes += dayData.totalAvailableMinutes;
//     }

//     // Calculate percentage for the week
//     const percentage = (totalMinutes / totalAvailableMinutes) * 100;

//     // Store only the percentage for the week
//     weeklyStatistics1m[weekLabel] = percentage;

//     startDate.add(1, 'week');
//     weekNumber++;
//   }

//   statistics[query.interval] = weeklyStatistics1m;
//   break;
//   case '6months':
//     // Divide the statistics into 1-month periods
//     const monthlyStatistics6m = {};
//     let currentMonth = moment().month(); // Get the current month number (0-11)
    
//     for (let i = 0; i < 6; i++) {
//       const monthLabel = `Month ${currentMonth + 1}`; // Month numbers start from 1
//       const startDateOfMonth = moment().subtract(i, 'months').startOf('month');
//       const endDateOfMonth = moment().subtract(i, 'months').endOf('month');
//       const daysInMonth = endDateOfMonth.diff(startDateOfMonth, 'days') + 1;
//       let totalMinutes = 0;
  
//       // Calculate total minutes for the month
//       for (let date = startDateOfMonth; date <= endDateOfMonth; date.add(1, 'day')) {
//         const dateString = date.format('YYYY-MM-DD');
//         const dayData = days[dateString] || { totalMinutes: 0, totalAvailableMinutes: 1440, percentage: 0 };
//         totalMinutes += dayData.totalMinutes;
//       }
  
//       // Calculate percentage for the month
//       const percentage = (totalMinutes / (daysInMonth * 1440)) * 100;
  
//       // Store only the percentage for the month
//       monthlyStatistics6m[monthLabel] = percentage;
  
//       currentMonth--; // Move to the previous month for the next iteration
//     }
  
//     statistics[query.interval] = monthlyStatistics6m;
//   break;
//   case '1year':
//     // Divide the statistics into 6-month periods
//     const halfYearlyStatistics1y = {};
//     let currentYear = moment().year(); // Get the current year
//     let halfYearCounter = 1;
//     for (let i = 0; i < 2; i++) { // Loop for two halves of the year
//         const startMonth = i * 6 + 1; // Starting month of the half year
//         const endMonth = startMonth + 5; // Ending month of the half year
//         const periodLabel = `Half ${halfYearCounter}`; // Label for the half year
//         let totalMinutes = 0;
//         let totalAvailableMinutes = 0;
    
//         // Calculate total minutes and available minutes for the half year
//         for (let month = startMonth; month <= endMonth; month++) {
//             const startDateOfMonth = moment().year(currentYear).month(month - 1).startOf('month');
//             const endDateOfMonth = moment().year(currentYear).month(month - 1).endOf('month');
//             const daysInMonth = endDateOfMonth.diff(startDateOfMonth, 'days') + 1;
          
//             for (let date = startDateOfMonth; date <= endDateOfMonth; date.add(1, 'day')) {
//                 const dateString = date.format('YYYY-MM-DD');
//                 const dayData = days[dateString] || { totalMinutes: 0, totalAvailableMinutes: 1440, percentage: 0 };
//                 totalMinutes += dayData.totalMinutes;
//                 totalAvailableMinutes += 1440; // Assuming every day has 1440 minutes
//             }
//         }
    
//         // Calculate percentage for the half year
//         const percentage = (totalMinutes / totalAvailableMinutes) * 100;
    
//         // Store only the percentage for the half year
//         halfYearlyStatistics1y[periodLabel] = percentage;
    
//         halfYearCounter++; // Increment counter for the next half year
//     }
    
//     statistics[query.interval] = halfYearlyStatistics1y;
//     break;
//         default:
//           break;
//       }

//       // Send statistics when all queries are processed
//       if (Object.keys(statistics).length === queries.length) {
//         res.json(statistics);
//       }
//     });
//   });
// });



// Express Routes statistics
app.get('/statistics', (req, res) => {
  const {interval, doctor_id} = req.query;

  // Check if the provided interval is valid
  if (!['1week', '1month', '6months', '1year'].includes(interval)) {
    res.status(400).json({ error: 'Invalid interval parameter. Supported intervals are: week, month, 6months, year.' });
    return;
  }

  // Check if doctor_id is provided
  if (!doctor_id) {
    res.status(400).json({ error: 'doctor_id is required.' });
    return;
  }

  // Define queries based on the selected interval
  const queries = [];

  switch (interval) {
    case '1week':
      const currentDate1w = moment();
      queries.push(
        { interval: 'Current Week', startDate: currentDate1w.clone().startOf('week'), endDate: currentDate1w.clone().endOf('week') }
      );
      break;
    case '1month':
      const currentMonth1m = moment();
      queries.push(
        { interval: 'Current Month', startDate: currentMonth1m.clone().startOf('month'), endDate: currentMonth1m.clone().endOf('month') }
      );
      break;
    case '6months':
      const currentMonth6m = moment();
      queries.push(
        { interval: 'Current 6 Months', startDate: currentMonth6m.clone().subtract(5, 'months').startOf('month'), endDate: currentMonth6m.clone().endOf('month') }
      );
      break;
    case '1year':
      const currentMonth1y = moment();
      queries.push(
        { interval: 'Current Year', startDate: currentMonth1y.clone().startOf('year'), endDate: currentMonth1y.clone().endOf('year') }
      );
      break;
    default:
      break;
  }

  const statistics = {};

  // Execute queries
  queries.forEach(query => {
    const days = {};
    const totalDays = query.endDate.diff(query.startDate, 'days') + 1; // Total days including the end date
    const sql = `SELECT 
        TIMESTAMPDIFF(MINUTE, tblconsulting.from_time, tblconsulting.to_time) AS minutes_spent,
        DATE(tblconsulting.date) AS date
      FROM tblconsulting 
      LEFT JOIN tblstudent ON tblconsulting.id_number = tblstudent.id_number
      LEFT JOIN tblstaff ON tblconsulting.id_number = tblstaff.id_number
      LEFT JOIN tbldoctor ON tbldoctor.doctor_id = tblconsulting.doctor_id
      WHERE tblconsulting.status = 'completed' 
        AND tblconsulting.doctor_id = ? 
        AND tblconsulting.date BETWEEN ? AND ?`;

        con.query(
          sql,
          [doctor_id, query.startDate.format("YYYY-MM-DD"), query.endDate.format("YYYY-MM-DD")],
          (err, results) => {
            if (err) {
              console.error('Error executing MySQL query:', err.stack);
              res.status(500).json({ error: 'Internal server error' });
              return;
            }

      results.forEach(result => {
        const date = moment(result.date).format('YYYY-MM-DD');
        if (!days[date]) {
          days[date] = {
            totalMinutes: 0,
            totalAvailableMinutes: 0,
            percentage: 0
          };
        }
        days[date].totalMinutes += result.minutes_spent;
      });

      // Calculate total available minutes for each day
      for (let date = moment(query.startDate); date <= query.endDate; date = date.clone().add(1, 'days')) {
        const dateString = date.format('YYYY-MM-DD');
        if (!days[dateString]) {
          days[dateString] = {
            totalMinutes: 0,
            totalAvailableMinutes: 0,
            percentage: 0
          };
        }
        days[dateString].totalAvailableMinutes = 1440; // Total minutes in a day
      }

      // Calculate percentage for each day
      Object.keys(days).forEach(date => {
        days[date].percentage = (days[date].totalMinutes / days[date].totalAvailableMinutes) * 100;
      });

      // Divide the statistics based on the requested interval
      switch (interval) {
      case '1week':
      const dailyStatistics1w = {};
      let dayCounter = 1;
      Object.keys(days).forEach(date => {
        const dayOfWeek = `day${dayCounter}`;
        // Only store the percentage for each day
        dailyStatistics1w[dayOfWeek] = days[date].percentage;
        dayCounter++;
      });
      statistics[query.interval] = dailyStatistics1w;
      break;
      case '1month':
      // Divide the statistics into weeks
      const weeklyStatistics1m = {};
      const startDate = query.startDate.clone(); // Clone the start date of the month
      const endDate = query.endDate.clone(); // Clone the end date of the month
      let weekNumber = 1;

      while (startDate.isBefore(endDate)) {
      const weekStart = startDate.clone().startOf('week');
      const weekEnd = startDate.clone().endOf('week');

      const weekLabel = `week${weekNumber}`;
      let totalMinutes = 0;
      let totalAvailableMinutes = 0;

      for (let date = weekStart; date.isSameOrBefore(weekEnd); date.add(1, 'day')) {
      const dateString = date.format('YYYY-MM-DD');
      const dayData = days[dateString] || { totalMinutes: 0, totalAvailableMinutes: 1440, percentage: 0 };
      totalMinutes += dayData.totalMinutes;
      totalAvailableMinutes += dayData.totalAvailableMinutes;
    }

    // Calculate percentage for the week
    const percentage = (totalMinutes / totalAvailableMinutes) * 100;

    // Store only the percentage for the week
    weeklyStatistics1m[weekLabel] = percentage;

    startDate.add(1, 'week');
    weekNumber++;
  }

  statistics[query.interval] = weeklyStatistics1m;
  break;
  case '6months':
    // Divide the statistics into 1-month periods
    const monthlyStatistics6m = {};
    let currentMonth = moment().month(); // Get the current month number (0-11)
    
    for (let i = 0; i < 6; i++) {
      const monthLabel = `month${currentMonth + 1}`; // Month numbers start from 1
      const startDateOfMonth = moment().subtract(i, 'months').startOf('month');
      const endDateOfMonth = moment().subtract(i, 'months').endOf('month');
      const daysInMonth = endDateOfMonth.diff(startDateOfMonth, 'days') + 1;
      let totalMinutes = 0;
  
      // Calculate total minutes for the month
      for (let date = startDateOfMonth; date <= endDateOfMonth; date.add(1, 'day')) {
        const dateString = date.format('YYYY-MM-DD');
        const dayData = days[dateString] || { totalMinutes: 0, totalAvailableMinutes: 1440, percentage: 0 };
        totalMinutes += dayData.totalMinutes;
      }
  
      // Calculate percentage for the month
      const percentage = (totalMinutes / (daysInMonth * 1440)) * 100;
  
      // Store only the percentage for the month
      monthlyStatistics6m[monthLabel] = percentage;
  
      currentMonth--; // Move to the previous month for the next iteration
    }
  
    statistics[query.interval] = monthlyStatistics6m;
  break;
  case '1year':
    // Divide the statistics into 6-month periods
    const halfYearlyStatistics1y = {};
    let currentYear = moment().year(); // Get the current year
    let halfYearCounter = 1;
    for (let i = 0; i < 2; i++) { // Loop for two halves of the year
        const startMonth = i * 6 + 1; // Starting month of the half year
        const endMonth = startMonth + 5; // Ending month of the half year
        const periodLabel = `half${halfYearCounter}`; // Label for the half year
        let totalMinutes = 0;
        let totalAvailableMinutes = 0;
    
        // Calculate total minutes and available minutes for the half year
        for (let month = startMonth; month <= endMonth; month++) {
            const startDateOfMonth = moment().year(currentYear).month(month - 1).startOf('month');
            const endDateOfMonth = moment().year(currentYear).month(month - 1).endOf('month');
            const daysInMonth = endDateOfMonth.diff(startDateOfMonth, 'days') + 1;
          
            for (let date = startDateOfMonth; date <= endDateOfMonth; date.add(1, 'day')) {
                const dateString = date.format('YYYY-MM-DD');
                const dayData = days[dateString] || { totalMinutes: 0, totalAvailableMinutes: 1440, percentage: 0 };
                totalMinutes += dayData.totalMinutes;
                totalAvailableMinutes += 1440; // Assuming every day has 1440 minutes
            }
        }
    
        // Calculate percentage for the half year
        const percentage = (totalMinutes / totalAvailableMinutes) * 100;
    
        // Store only the percentage for the half year
        halfYearlyStatistics1y[periodLabel] = percentage;
    
        halfYearCounter++; // Increment counter for the next half year
    }
    
    statistics[query.interval] = halfYearlyStatistics1y;
    break;
        default:
          break;
      }

      // Send statistics when all queries are processed
      if (Object.keys(statistics).length === queries.length) {
        res.json(statistics);
      }
    });
  });
});



// Route for searching
app.get('/search', (req, res) => {
  res.header('Content-Type', 'application/json');

  // Extracting keyword from query parameters
  const {keyword} = req.query; // Assuming the keyword is passed in the query parameters

  const consultingQuery = `
    SELECT tblstudent.organization_name, tblconsulting.patient_name, tblstudent.profile, tblconsulting.sick_type, tblconsulting.consult_id, tblconsulting.id_number,
       DATE_FORMAT(tblconsulting.date, '%d-%m-%y') AS date,
       CONCAT(DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), ' - ', DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')) AS consultation_time
    FROM tblconsulting 
    INNER JOIN tblstudent ON tblconsulting.id_number = tblstudent.id_number
    WHERE 
      tblstudent.organization_name LIKE '%${keyword}%' OR
      tblconsulting.patient_name LIKE '%${keyword}%' OR
      tblstudent.profile LIKE '%${keyword}%' OR
      tblconsulting.sick_type LIKE '%${keyword}%' OR
      tblconsulting.consult_id LIKE '%${keyword}%' OR
      tblconsulting.id_number LIKE '%${keyword}%'
    ORDER BY tblconsulting.date ASC; 
  `;

  const staffQuery = `
    SELECT tblstaff.organization_name, tblconsulting.patient_name, tblstaff.profile, tblconsulting.sick_type, tblconsulting.consult_id,  tblconsulting.id_number,
           DATE_FORMAT(tblconsulting.date, '%d-%m-%y') AS date,
           CONCAT(DATE_FORMAT(tblconsulting.from_time, '%h:%i %p'), ' - ', DATE_FORMAT(tblconsulting.to_time, '%h:%i %p')) AS consultation_time
    FROM tblconsulting 
    INNER JOIN tblstaff ON tblconsulting.id_number = tblstaff.id_number
    WHERE 
      tblstaff.organization_name LIKE '%${keyword}%' OR
      tblconsulting.patient_name LIKE '%${keyword}%' OR
      tblstaff.profile LIKE '%${keyword}%' OR
      tblconsulting.sick_type LIKE '%${keyword}%' OR
      tblconsulting.consult_id LIKE '%${keyword}%' OR
      tblconsulting.id_number LIKE '%${keyword}%'
    ORDER BY tblconsulting.date ASC; 
  `;

  // Execute the consulting query
  con.query(consultingQuery, (err, consultingResult) => {
    if (err) {
      console.error('Error executing consulting query:', err);
      return res.status(500).json({ result: 'failure', message: 'Error executing consulting query. Please try again later.' });
    }

    // Execute the staff query
    con.query(staffQuery, (err, staffResult) => {
      if (err) {
        console.error('Error executing staff query:', err);
        return res.status(500).json({ result: 'failure', message: 'Error executing staff query. Please try again later.' });
      }

      // Combine all results including consulting and staff results
      const combinedResults = {
        consulting: consultingResult,
        staff: staffResult
      };

      // Check if both consulting and staff results are empty
      if (consultingResult.length === 0 && staffResult.length === 0) {
        return res.status(404).json({ result: 'failure', message: 'No results found for the search query.' });
      }

      // Send the combined results as JSON response
      res.status(200).json({ result: 'success', data: combinedResults });
    });
  });
});


// Route for searching medicine_name
app.get('/medicine_name', (req, res) => {
  res.header('Content-Type', 'application/json');

  const { keyword } = req.query;

  let query;
  let queryParams = [];

  if (keyword) {
    query = `
      SELECT medicine_name FROM tblmedicine_name
      WHERE medicine_name LIKE ?;
    `;
    queryParams = [`%${keyword}%`];
  } else {
    query = `
      SELECT medicine_name FROM tblmedicine_name;
    `;
  }

  con.query(query, queryParams, (err, medicineResult) => {
    if (err) {
      console.error('Error executing medicine query:', err);
      return res.status(500).json({ result: 'failure', message: 'Error executing medicine query. Please try again later.' });
    }

    if (medicineResult.length === 0) {
      return res.status(404).json({ result: 'failure', message: 'No results found.' });
    }

    const medicineNames = medicineResult.map(medicine => medicine.medicine_name);
    res.status(200).json({ result: 'success', data: { medicine: medicineNames } });
  });
});



// Doctor Module Backend End By Patchaiyappan


// Organization Onboarding Backend Start By Patchaiyappan

// POST endpoint to add a new class
app.post('/add_class', (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
    const {
      classes_name, division, department, strength, HCR, updated_by, updated_at, id_number, organization_name
    } = req.body;

    // Assuming 'con' is your database connection object
    con.connect(function(err) {
      if (err) {
        console.error("Database connection error:", err);
        return res.status(500).json({ Result: "Failure", message: "Database connection error" });
      }
      
      console.log("Connected to database!");
      
      // Using parameterized queries to prevent SQL injection
      var sql = "INSERT INTO tblclasses (classes_name, division, department, strength, HCR, updated_by, updated_at, id_number, organization_name) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)";
      con.query(sql, [classes_name || null, division || null, department || null, strength || null, HCR || null, updated_by || null, updated_at || null, id_number || null, organization_name || null], function(err, result) {
        if (err) {
          console.error("Database query error:", err);
          return res.status(500).json({ Result: "Failure", message: "Database query error" });
        }
        
        console.log("Record inserted successfully");
        res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
      });
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});

  
  // Update class information by ID
app.put('/update_class_id',(req, res) => {
    res.header('Content-Type', 'application/json');
  
    try {
      const { classes_name, division, department, strength, HCR, updated_by, id_number, id } = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `UPDATE tblclasses SET classes_name = ?, division = ?, department = ?, strength = ?, HCR = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP, id_number = ? WHERE id = ?`;
        con.query(sql, [classes_name || null, division || null, department || null, strength || null, HCR || null, updated_by || null, id_number || null, id], function (err, result) {
          if (err) throw err;
          console.log("1 record updated");
          res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
        });
      });
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    } 
  });

  
  // GET endpoint to retrieve specific columns of all classes
app.get('/view_all_classes', (req, res) => {
    res.header('Content-Type', 'application/json');
    const {organization_name} = req.query;

    try {
        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `SELECT 
                            tblclasses.id, 
                            tblclasses.classes_name, 
                            tblclasses.division, 
                            tblclasses.department, 
                            tblclasses.strength, 
                            tblclasses.HCR, 
                            tblclasses.updated_by, 
                            DATE_FORMAT(tblclasses.updated_at, '%Y-%m-%d') AS created_date 
                        FROM tblclasses
                        INNER JOIN tbluser ON tblclasses.organization_name = tbluser.organization_name`;

            if (organization_name) {
                sql += " WHERE tblclasses.organization_name = ?";
            }

            sql += " ORDER BY tblclasses.id DESC";

            con.query(sql, [organization_name], function(err, result) {
                if (err) throw err;
                console.log("Records viewed in reverse order");
                res.status(200).json({ Result: "Success", message: "Data viewed successfully in reverse order", result });
            });
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
    }
});


  
  // DELETE endpoint to delete class by ID
app.delete('/delete_class_by_id',(req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      const{id} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = "DELETE FROM tblclasses WHERE id =?";
        con.query(sql, [id], function (err, result) {
          if (err) throw err;
          console.log("record deleted");
          res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
        });
      });
    } catch (e) {
      console.error('Error:', e);
      res.status(500).json({ Result: "Failure", message: e.message });
    }
  });


  // Route to get the count of tbldepartment
app.get('/Total_department_count', (req, res) => {
    const { organization_name } = req.query;

    let sql = `SELECT COUNT(*) AS count 
               FROM tbldepartment  
               INNER JOIN tbluser ON tbldepartment.organization_name = tbluser.organization_name`;

    let params = [];
    if (organization_name) {
        sql += " WHERE tbldepartment.organization_name = ?";
        params.push(organization_name);
    }

    con.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error querying database: ', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.json({ count: results[0].count });
    });
});



// Route to get the count of tbldesignation
app.get('/Total_designation_count', (req, res) => {
    const { organization_name } = req.query;

    let sql = `SELECT COUNT(*) AS count 
               FROM tbldesignation 
               INNER JOIN tbluser ON tbldesignation.organization_name = tbluser.organization_name`;

    let params = [];
    if (organization_name) {
        sql += " WHERE tbldesignation.organization_name = ?";
        params.push(organization_name);
    }

    con.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error querying database: ', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.json({ count: results[0].count });
    });
});


// Route to get the count of tblstaff & tblstudent
app.get('/Total_recovery_count', (req, res) => {
    const { organization_name } = req.query;

    let baseQuery = `
      SELECT SUM(count) AS count
      FROM (
        SELECT COUNT(*) AS count 
        FROM tblstaff 
        INNER JOIN tbluser ON tblstaff.organization_name = tbluser.organization_name 
        WHERE tblstaff.is_deleted = 1
        UNION ALL
        SELECT COUNT(*) AS count 
        FROM tblstudent 
        INNER JOIN tbluser ON tblstudent.organization_name = tbluser.organization_name 
        WHERE tblstudent.is_deleted = 1
      ) AS combined_counts
    `;

    let params = [];
    if (organization_name) {
        baseQuery = `
          SELECT SUM(count) AS count
          FROM (
            SELECT COUNT(*) AS count 
            FROM tblstaff 
            INNER JOIN tbluser ON tblstaff.organization_name = tbluser.organization_name 
            WHERE tblstaff.is_deleted = 1 AND tblstaff.organization_name = ?
            UNION ALL
            SELECT COUNT(*) AS count 
            FROM tblstudent 
            INNER JOIN tbluser ON tblstudent.organization_name = tbluser.organization_name 
            WHERE tblstudent.is_deleted = 1 AND tblstudent.organization_name = ?
          ) AS combined_counts
        `;
        params = [organization_name, organization_name];
    }

    con.query(baseQuery, params, (err, results) => {
        if (err) {
            console.error('Error querying database: ', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        res.json({ count: results[0].count });
    });
});



  // Route to get the count of tblclasses
app.get('/Total_classes_count', (req, res) => {
    const { organization_name } = req.query;

    let sql = `
      SELECT COUNT(*) AS class
      FROM tblclasses
      INNER JOIN tbluser ON tblclasses.organization_name = tbluser.organization_name
    `;

    let params = [];
    if (organization_name) {
        sql += " WHERE tblclasses.organization_name = ?";
        params.push(organization_name);
    }

    con.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error querying database: ', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        const classes = results[0].class;
        console.log(`Total class count: ${classes}`);
        res.status(200).json({ Result: "Success", classes });
    });
});


  // Route to get the count of tblstaff
app.get('/Total_staff_count', (req, res) => {
    res.header('Content-Type', 'application/json');

    // Extract organization_name from query parameters
    const { organization_name } = req.query;

    // Base SQL query
    let sql = `
      SELECT COUNT(*) AS total_staff 
      FROM tblstaff 
      INNER JOIN tbluser ON tblstaff.organization_name = tbluser.organization_name 
      WHERE (tblstaff.is_deleted = 0 OR tblstaff.is_deleted IS NULL)
    `;

    // Parameters for SQL query
    let params = [];

    // Check if organization_name is provided
    if (organization_name) {
      sql += " AND tblstaff.organization_name = ?";
      params.push(organization_name);
    }

    // Execute the query
    con.query(sql, params, function(err, result) {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ Result: "Error", message: "Internal Server Error" });
      }

      // Check if result is valid and return the count
      if (result.length > 0) {
        const staff = result[0].total_staff;
        console.log(`Total staff count: ${staff}`);
        res.status(200).json({ Result: "Success", staff });
      } else {
        res.status(404).json({ Result: "Error", message: "No staff found" });
      }
    });
});


 // Route to get the count of tblstudent
app.get('/Total_student_count', (req, res) => {
    res.header('Content-Type', 'application/json');

    // Extract organization_name from query parameters
    const { organization_name } = req.query;

    // Base SQL query
    let sql = `
      SELECT COUNT(*) AS total_student 
      FROM tblstudent 
      INNER JOIN tbluser ON tblstudent.organization_name = tbluser.organization_name 
      WHERE (tblstudent.is_deleted = 0 OR tblstudent.is_deleted IS NULL)
    `;

    // Parameters for SQL query
    let params = [];

    // Check if organization_name is provided
    if (organization_name) {
      sql += " AND tblstudent.organization_name = ?";
      params.push(organization_name);
    }

    // Execute the query
    con.query(sql, params, function(err, result) {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ Result: "Error", message: "Internal Server Error" });
      }

      // Check if result is valid and return the count
      if (result.length > 0) {
        const student = result[0].total_student;
        console.log(`Total student count: ${student}`);
        res.status(200).json({ Result: "Success", student });
      } else {
        res.status(404).json({ Result: "Error", message: "No students found" });
      }
    });
});


  
  // Route to count total consulting registrations
app.get('/count_total_consulting_register', (req, res) => {
    res.header('Content-Type', 'application/json');

    // Base SQL query
    let sql = `
      SELECT COUNT(*) AS recordCount 
      FROM tblconsulting
      INNER JOIN tbluser ON tblconsulting.organization_name = tbluser.organization_name
      LEFT JOIN tblstudent ON tblconsulting.id_number = tblstudent.id_number
      LEFT JOIN tblstaff ON tblconsulting.id_number = tblstaff.id_number 
      WHERE (tblconsulting.status = 'new' OR tblconsulting.status = 'waiting')
    `;

    // Parameters array for query
    let params = [];

    // Check if fromDate and toDate are provided in the query parameters
    if (req.query.fromDate && req.query.toDate) {
      sql += " AND tblconsulting.date BETWEEN ? AND ?";
      params.push(req.query.fromDate, req.query.toDate);
    }

    // Check if organization_name is provided in the query parameters
    if (req.query.organization_name) {
      sql += " AND tblconsulting.organization_name = ?";
      params.push(req.query.organization_name);
    }

    // Execute the query with parameters
    con.query(sql, params, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ Result: "Error", message: err.message });
        return;
      }

      const recordCount = result[0].recordCount;
      console.log(`Total records count: ${recordCount}`);

      res.status(200).json({ Result: "Success", recordCount });
    });
});


  
  // Route to count total consulting registrations marked as done
app.get('/count_total_consulting_done', (req, res) => {
    res.header('Content-Type', 'application/json');

    // Base SQL query
    let sql = `
      SELECT COUNT(*) AS recordCount 
      FROM tblconsulting
      INNER JOIN tbluser ON tblconsulting.organization_name = tbluser.organization_name
      LEFT JOIN tblstudent ON tblconsulting.id_number = tblstudent.id_number
      LEFT JOIN tblstaff ON tblconsulting.id_number = tblstaff.id_number
      WHERE tblconsulting.status = 'completed'
    `;

    // Parameters array for query
    let params = [];

    // Check if fromDate and toDate are provided in the query parameters
    if (req.query.fromDate && req.query.toDate) {
      sql += " AND tblconsulting.date BETWEEN ? AND ?";
      params.push(req.query.fromDate, req.query.toDate);
    }

    // Check if organization_name is provided in the query parameters
    if (req.query.organization_name) {
      sql += " AND (tblstudent.organization_name = ? OR tblstaff.organization_name = ?)";
      params.push(req.query.organization_name, req.query.organization_name);
    }

    // Execute the query with parameters
    con.query(sql, params, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ Result: "Error", message: err.message });
        return;
      }

      const recordCount = result[0].recordCount;
      console.log(`Total records count marked as completed: ${recordCount}`);

      res.status(200).json({ Result: "Success", recordCount });
    });
});


  // Route to count total instock medicines where quantity > 10
app.get('/count_instock_medicine', (req, res) => {
    res.header('Content-Type', 'application/json');

    // Extract organization_name from query parameters
    const { organization_name } = req.query;

    // Base SQL query with inner join
    let sql = `
      SELECT COUNT(*) AS instock 
      FROM tblmedicine_list
      INNER JOIN tbluser ON tblmedicine_list.organization_name = tbluser.organization_name
      WHERE tblmedicine_list.quantity > 10
    `;

    // Parameters array for query
    let params = [];

    // Check if organization_name is provided in the query parameters
    if (organization_name) {
        sql += " AND tblmedicine_list.organization_name = ?";
        params.push(organization_name);
    }

    // Execute the query with parameters
    con.query(sql, params, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ Result: "Error", message: err.message });
            return;
        }

        const instock = result[0].instock;
        console.log(`Total instock count: ${instock}`);

        res.status(200).json({ Result: "Success", instock });
    });
});


  
  // Route to count total out-of-stock medicines where quantity < 10
app.get('/count_outofstock_medicine', (req, res) => {
    res.header('Content-Type', 'application/json');

    // Extract organization_name from query parameters
    const { organization_name } = req.query;

    // Base SQL query with inner join
    let sql = `
      SELECT COUNT(*) AS outofstock 
      FROM tblmedicine_list
      INNER JOIN tbluser ON tblmedicine_list.organization_name = tbluser.organization_name
      WHERE tblmedicine_list.quantity < 10
    `;

    // Parameters array for query
    let params = [];

    // Check if organization_name is provided in the query parameters
    if (organization_name) {
        sql += " AND tblmedicine_list.organization_name = ?";
        params.push(organization_name);
    }

    // Execute the query with parameters
    con.query(sql, params, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).json({ Result: "Error", message: err.message });
            return;
        }

        const outofstock = result[0].outofstock;
        console.log(`Out of stock count: ${outofstock}`);

        res.status(200).json({ Result: "Success", outofstock });
    });
});


 // Route to count total consulting records marked as completed for today
app.get('/count_total_consulting_done_today', (req, res) => {
    res.header('Content-Type', 'application/json');
    
    // Calculate today's date
    const today = moment().format('YYYY-MM-DD');
    
    // Base SQL query with inner join
    let sql = `SELECT COUNT(*) AS recordCount FROM tblconsulting 
               INNER JOIN tbluser ON tblconsulting.organization_name = tbluser.organization_name
               LEFT JOIN tblstudent ON tblconsulting.id_number = tblstudent.id_number
               LEFT JOIN tblstaff ON tblconsulting.id_number = tblstaff.id_number
               WHERE tblconsulting.status = 'completed' AND tblconsulting.date = ?`;
    let query = [today];
  
    // Add organization filter if provided
    if (req.query.organization_name) {
      sql += ` AND (tblconsulting.organization_name = ?)`;
      query.push(req.query.organization_name);
    }
  
    // Execute the SQL query with parameters
    con.query(sql, query, (err, result) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        return res.status(500).json({ Result: "Failure", message: "Internal Server Error" });
      }
      
      const recordCount = result[0].recordCount;
      console.log(`Total consulting records done today: ${recordCount}`);
      res.status(200).json({ Result: "Success", recordCount });
    });
});


  app.put('/Is_deleted_multiple_delete_appointment', (req,res) => {
    try {
      const { consult_id } = req.body; // Assuming ids is an array of appointment IDs to delete
  
      // Check if ids array is provided
      if (!consult_id || !Array.isArray(consult_id) || consult_id.length === 0) {
          return res.status(400).json({ result: 'failure', message: 'Please provide an array of appointment IDs to delete' });
      }
  
      // Construct the SQL query to delete appointments
      const sql = `update tblconsulting set is_deleted="1" where consult_id IN (?)`;
  
      // Execute the SQL query
      con.query(sql, [consult_id], (err, result) => {
          if (err) {
              console.error('Error deleting appointments:', err);
              return res.status(500).json({ result: 'failure', message: 'Internal Server Error' });
          }
  
          const affectedRows = result ? result.affectedRows : 0;
          res.status(200).json({ result: 'success', message: "${affectedRows} appointments deleted successfully "});
      });
  } catch (ex) {
      console.error('Exception:', ex);
      res.status(500).json({ result: 'failure', message: 'Internal Server Error' });
  }
  });

  app.put('/update_status_waiting', (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
      const { consult_id } = req.body;
      var sql = "UPDATE tblconsulting SET status = 'waiting' WHERE consult_id = ?";
      con.query(sql, [consult_id], function (err, result) {
        if (err) {
          console.error('Error:', err);
          res.status(500).json({ Result: "Failure", message: err.message });
          return;
        }
        console.log("record updated: " + JSON.stringify(result));
        res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
      });
    } catch (e) {
      console.error('Error:', e);
      res.status(500).json({ Result: "Failure", message: e.message });
    }
  });



  app.get('/get_consulting_api_b', (req, res) => {
    res.header('Content-Type', 'application/json');
    con.connect(function (err) {
        if (err) {
            console.error("Connection error:", err);
            res.status(500).json({ Result: "Failure", message: "Database connection error" });
            return;
        }
        console.log("Connected!");
        var sql = `SELECT distinct
            c.patient_name, c.sick_type, c.consult_id, 
            CONCAT(c.classes, '/', c.division) AS class_and_division, 
            DATE_FORMAT(c.date, '%b %e,%Y') AS date,
            c.id_number, c.assignee, TIME_FORMAT(c.from_time, '(%l:%i%p)') AS from_time,
            COALESCE((SELECT p1.mobile_number FROM tblparent p1 WHERE p1.id_number = c.id_number LIMIT 1), st.mobile_number) AS parent_mobile_number,
            c.hcr_name, st.id_number AS hcr_id_number
        FROM 
            tblconsulting c
        LEFT JOIN 
            tblstaff st ON c.hcr_name = st.name
        LEFT JOIN 
            tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
        WHERE 
            c.status IN ('new', 'waiting', 'cancelled')`;
  
        con.query(sql, function (err, result) {
            if (err) {
                console.error("Query error:", err);
                res.status(500).json({ Result: "Failure", message: "Error executing query" });
                return;
            }
            console.log(`${result.length} record(s) retrieved`);
  
            const arrayList = result.map(item => ({
                patient_name: item.patient_name,
                sick_type: item.sick_type,
                consult_id: item.consult_id,
                class_and_division: item.class_and_division,
                date: item.date
            }));
  
            const balanceArrayList = result.map(item => ({
                id_number: item.id_number,
                consult_id: item.consult_id,
                mobile_number: item.parent_mobile_number,
                hcr_name: item.hcr_name, 
                assignee: item.assignee,
                hcr_id_number: item.hcr_id_number,
                from_time: item.from_time 
            }));
  
            // Constructing JSON response object
            const jsonResponse = {
                Result: "Success",
                message: "Data viewed successfully",
                arrayList: arrayList,
                balanceArrayList: balanceArrayList
            };
  
            // Sending JSON response
            res.status(200).json(jsonResponse);
        });
    });
  });


  app.get('/get_consulting_api_a', (req, res) => {
    res.header('Content-Type', 'application/json');
    con.connect(function (err) {
        if (err) {
            console.error("Connection error:", err);
            res.status(500).json({ Result: "Failure", message: "Database connection error" });
            return;
        }
        console.log("Connected!");
        var sql = `SELECT distinct
            c.patient_name, c.sick_type, c.consult_id, 
            CONCAT(c.classes, '/', c.division) AS class_and_division, 
            DATE_FORMAT(c.date, '%b %e,%Y') AS date,
            c.id_number, c.assignee, TIME_FORMAT(c.from_time, '(%l:%i%p)') AS from_time,
            COALESCE((SELECT p1.mobile_number FROM tblparent p1 WHERE p1.id_number = c.id_number LIMIT 1), st.mobile_number) AS parent_mobile_number,
            c.hcr_name, st.id_number AS hcr_id_number
        FROM 
            tblconsulting c
        LEFT JOIN 
            tblstaff st ON c.hcr_name = st.name
        LEFT JOIN 
            tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
        WHERE 
            c.status IN ('completed')`;
  
        con.query(sql, function (err, result) {
            if (err) {
                console.error("Query error:", err);
                res.status(500).json({ Result: "Failure", message: "Error executing query" });
                return;
            }
            console.log(`${result.length} record(s) retrieved`);
  
            const arrayList = result.map(item => ({
                patient_name: item.patient_name,
                sick_type: item.sick_type,
                consult_id: item.consult_id,
                class_and_division: item.class_and_division,
                date: item.date
            }));
  
            const balanceArrayList = result.map(item => ({
                id_number: item.id_number,
                consult_id: item.consult_id,
                mobile_number: item.parent_mobile_number,
                hcr_name: item.hcr_name, 
                assignee: item.assignee,
                hcr_id_number: item.hcr_id_number,
                from_time: item.from_time 
            }));
  
            // Constructing JSON response object
            const jsonResponse = {
                Result: "Success",
                message: "Data viewed successfully",
                arrayList: arrayList,
                balanceArrayList: balanceArrayList
            };
  
            // Sending JSON response
            res.status(200).json(jsonResponse);
        });
    });
});


// GET Search Consulting History
app.get('/search_c_history', (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
        const { keyword, organization_name } = req.query;
        console.log(keyword);
        console.log('Organization:', organization_name);
        
        // Base SQL query
        let sql = `
            SELECT 
                c.patient_name, c.sick_type, c.consult_id, c.classes, c.division, c.date, c.id_number, c.assignee, c.from_time,
                c.hcr_name AS class_hcr,
                st.mobile_number AS staff_mobile_number, st.id_number AS staff_id_number,
                p.mobile_number AS parent_mobile_number
            FROM 
                tblconsulting c
            LEFT JOIN 
                tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
            LEFT JOIN 
                tblstaff st ON c.hcr_name = st.name
            LEFT JOIN 
                tblparent p ON c.id_number = p.id_number
            INNER JOIN 
                tbluser u ON c.organization_name = u.organization_name
            WHERE 
                (c.patient_name LIKE ? OR
                c.sick_type LIKE ? OR
                c.classes LIKE ? OR
                c.division LIKE ? OR
                c.assignee LIKE ? OR
                c.hcr_name LIKE ? OR
                st.mobile_number LIKE ? OR
                st.id_number LIKE ? OR
                p.mobile_number LIKE ?)
        `;
  
        // Include organization_name filter if provided
        const params = [
            `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, 
            `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`
        ];
  
        if (organization_name) {
            sql += ` AND u.organization_name = ?`;
            params.push(organization_name);
        }
  
        console.log('keyword:', `%${keyword}%`);
  
        con.query(sql, params, (error, results, fields) => {
            if (error) {
                console.error('Error executing SQL query:', error);
                res.status(500).json({ Result: "Failure", message: "Error executing SQL query" });
                return;
            }
  
            if (!Array.isArray(results)) {
                console.error('Query result is not iterable');
                res.status(500).json({ Result: "Failure", message: "Query result is not iterable" });
                return;
            }

            // Filter results to ensure uniqueness if needed
            const uniqueResults = Array.from(new Set(results.map(item => item.consult_id)))
                .map(id => results.find(item => item.consult_id === id));
  
            res.status(200).json({ Result: "Success", data: uniqueResults });
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ Result: "Failure", message: error.message });
    }
});

  




// Route for filtering data by date range
app.get('/consult_done_date_filter', (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
      const { start_date, end_date, organization_name } = req.query;
  
      // Check if start and end dates are provided
      if (!start_date || !end_date) {
        return res.status(400).json({
          result: "Failure",
          message: "Please provide valid start_date and end_date"
        });
      }
  
      // Base SQL query
      let sql = `
        SELECT DISTINCT
          c.patient_name, c.sick_type, c.consult_id,
          CONCAT(c.classes, '/', c.division) AS class_and_division, 
          DATE_FORMAT(c.date, '%b %e, %Y') AS date,
          c.id_number, c.assignee, TIME_FORMAT(c.from_time, '(%l:%i %p)') AS formatted_from_time,
          COALESCE((SELECT p1.mobile_number FROM tblparent p1 WHERE p1.id_number = c.id_number LIMIT 1), st.mobile_number) AS parent_mobile_number,
          c.hcr_name, st.id_number AS hcr_id_number
        FROM 
          tblconsulting c
        LEFT JOIN 
          tblparent p ON c.id_number = p.id_number
        LEFT JOIN 
          tblstaff st ON c.hcr_name = st.name
        LEFT JOIN 
          tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
        INNER JOIN 
          tbluser u ON c.organization_name = u.organization_name
        WHERE 
          c.status IN ('completed', 'cancelled') AND 
          c.date >= ? AND c.date <= ?`;
  
      // Parameters array for SQL query
      const params = [start_date, end_date];
  
      // Add organization name filter if provided
      if (organization_name) {
        sql += ` AND u.organization_name = ?`;
        params.push(organization_name);
      }
  
      // Execute the SQL query with the provided date range and organization name parameters
      con.query(sql, params, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ result: "Failure", message: err.message });
        }
  
        console.log(`${result.length} record(s) retrieved`);
  
        // Map the database results to the desired format
        const arrayList = result.map(row => ({
          patient_name: row.patient_name,
          sick_type: row.sick_type,
          consult_id: row.consult_id,
          class_and_division: row.class_and_division,
          date: row.date,
          id_number: row.id_number,
          mobile_number: row.parent_mobile_number, // Changed to parent_mobile_number
          hcr: row.hcr_name,
          assignee: row.assignee,
          hcr_id_number: row.hcr_id_number,
          from_time: row.formatted_from_time // Changed to formatted_from_time
        }));
  
        // Prepare JSON response
        const jsonResponse = {
          result: "Success",
          message: "Data viewed successfully",
          arrayList: arrayList
        };
  
        // Sending JSON response
        res.status(200).json(jsonResponse);
      });
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ result: "Failure", message: ex.message });
    }
  });
  


  app.get('/consult_cancel_date_filter', (req, res) => {
    res.header('Content-Type', 'application/json');
  
    try {
      const { start_date, end_date, organization_name } = req.query;
  
      // Check if start and end dates are provided
      if (!start_date || !end_date) {
        return res.status(400).json({
          result: "Failure",
          message: "Please provide valid start_date and end_date"
        });
      }
  
      // Base SQL query
      let sql = `
        SELECT DISTINCT
          c.patient_name, c.sick_type, c.consult_id,
          CONCAT(c.classes, '/', c.division) AS class_and_division, 
          DATE_FORMAT(c.date, '%b %e, %Y') AS date,
          c.id_number, c.assignee, TIME_FORMAT(c.from_time, '(%l:%i %p)') AS formatted_from_time,
          COALESCE((SELECT p1.mobile_number FROM tblparent p1 WHERE p1.id_number = c.id_number LIMIT 1), st.mobile_number) AS parent_mobile_number,
          c.hcr_name, st.id_number AS hcr_id_number
        FROM 
          tblconsulting c
        LEFT JOIN 
          tblparent p ON c.id_number = p.id_number
        LEFT JOIN 
          tblstaff st ON c.hcr_name = st.name
        LEFT JOIN 
          tblclasses cl ON c.classes = cl.classes_name AND c.division = cl.division
        INNER JOIN 
          tbluser u ON c.organization_name = u.organization_name
        WHERE 
          c.status = 'cancelled' AND 
          c.date >= ? AND c.date <= ?`;
  
      // Parameters array for SQL query
      const params = [start_date, end_date];
  
      // Add organization name filter if provided
      if (organization_name) {
        sql += ` AND u.organization_name = ?`;
        params.push(organization_name);
      }
  
      // Execute the SQL query with the provided date range and organization name parameters
      con.query(sql, params, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ result: "Failure", message: err.message });
        }
  
        console.log(`${result.length} record(s) retrieved`);
  
        // Map the database results to desired format
        const arrayList = result.map(row => ({
          patient_name: row.patient_name,
          sick_type: row.sick_type,
          consult_id: row.consult_id,
          class_and_division: row.class_and_division,
          date: row.date,
          id_number: row.id_number,
          mobile_number: row.parent_mobile_number,
          hcr: row.hcr_name,
          assignee: row.assignee,
          hcr_id_number: row.hcr_id_number,
          from_time: row.formatted_from_time
        }));
  
        // Prepare JSON response
        const jsonResponse = {
          result: "Success",
          message: "Data viewed successfully",
          arrayList: arrayList
        };
  
        // Sending JSON response
        res.status(200).json(jsonResponse);
      });
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ result: "Failure", message: ex.message });
    }
  });
  


  // GET endpoint to retrieve departments with optional organization_name filter
app.get('/view_department', (req, res) => {
    res.header('Content-Type', 'application/json');
    const {organization_name} = req.query;

    try {
        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `SELECT 
                           tbldepartment.id, 
                           tbldepartment.department, 
                           DATE_FORMAT(tbldepartment.created_date, '%Y-%m-%d') AS created_date 
                       FROM tbldepartment
                       INNER JOIN tbluser ON tbldepartment.organization_name = tbluser.organization_name`;

            if (organization_name) {
                sql += " WHERE tbldepartment.organization_name = ?";
            }

            sql += " ORDER BY tbldepartment.id DESC";

            con.query(sql, [organization_name], function(err, result) {
                if (err) throw err;
                console.log("Records viewed in reverse order");
                res.status(200).json({ Result: "Success", message: "Data viewed successfully in reverse order", result });
            });
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
    }
});


  app.post('/adddepartment', (req, res) =>{
    res.header('Content-Type', 'application/json');
    try{
      const{department, updated_by, organization_name} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `INSERT INTO tbldepartment ( department, updated_by, doc, created_date,  updated_at, organization_name) VALUES (?,?, NOW(),NOW(), CURRENT_TIMESTAMP(), ?)`;
        con.query(sql, [department || null, updated_by || null, organization_name || null], function (err, result) {
          if (err) throw err;
          console.log("record inserted");
          res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
        });
      });
    } catch   (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    }
  });


  app.put('/updatedepartment',(req, res) => {
    res.header('Content-Type', 'application/json');
  
    try{
      const{id, department} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `UPDATE tbldepartment SET department =?, dou = NOW(), updated_at = CURRENT_TIMESTAMP() WHERE id =?`;
        con.query(sql, [department || null, id], function (err, result) {
          if (err) throw err;
          console.log("1 record updated");
          res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
        });
      });
    } catch   (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    } 
    
  });


  app.delete('/deletedepartment',(req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      const{id} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `DELETE FROM tbldepartment WHERE id =?`;
        con.query(sql, [id], function (err, result) {
          if (err) throw err;
          console.log("record deleted");
          res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
        });
      });
    } catch (e) {
      console.error('Error:', e);
      res.status(500).json({ Result: "Failure", message: e.message });
    }
  });


  // GET endpoint to retrieve designations with optional organization_name filter
app.get('/view_designation', (req, res) => {
    res.header('Content-Type', 'application/json');
    const {organization_name} = req.query;

    try {
        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `SELECT designation_role, department  FROM tbldesignation`;

            if (organization_name) {
                sql += ` INNER JOIN tbluser ON tbldesignation.organization_name = tbluser.organization_name 
                         WHERE tbldesignation.organization_name = ?`;
            }

            sql += " ORDER BY tbldesignation.id DESC";

            con.query(sql, [organization_name], function(err, result) {
                if (err) throw err;
                console.log("Records viewed");
                res.status(200).json({ Result: "Success", message: "Data viewed successfully", result });
            });
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
    }
});



  app.post('/add_designation', (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
      const { department, designation_role, organization_name } = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `INSERT INTO tbldesignation ( department, designation_role, doc, updated_at, organization_name) VALUES (?, ?, NOW(), CURRENT_TIMESTAMP(), ?)`;
        con.query(sql, [ department || null, designation_role || null, organization_name || null,], function (err, result) {
          if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).json({ Result: "Failure", message: "Failed to insert data" });
          } else {
            console.log("1 record inserted");
            res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
          }
        });
      });
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }  
  });

  
  app.put('/update_designtion', (req, res) => {
    res.header('Content-Type', 'application/json');
    try{
      const{id, department, designation_role, updated_by} = req.body;
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `UPDATE tbldesignation SET department =?, designation_role =?, dou = NOW(), updated_by =?, updated_at = CURRENT_TIMESTAMP() WHERE id =?`;
        con.query(sql, [department || null, designation_role || null, updated_by || null, id], function (err, result) {
          if (err) throw err;
          console.log("1 record updated");
          res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
        });
      });
      } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
      }    
    });


    app.delete('/delete_designation', (req, res) => {
        res.header('Content-Type', 'application/json');
        try{
          const{id} = req.body;
          con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
            var sql = `DELETE FROM tbldesignation WHERE id =?`;
            con.query(sql, [id], function (err, result) {
              if (err) throw err;
              console.log("record deleted");
              res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
            });
          });
        } catch (err) {
          console.error('Error:', err);
          res.status(500).json({ Result: "Failure", message: err.message });
        }      
      });


      app.post('/viewbyid_appointment_detail', (req, res) => {
        res.header('Content-Type', 'application/json');
        const id_number = req.body.id_number;
      
        const combinedView = `
          SELECT 
            c.id_number, 
            CASE
              WHEN s.id_number IS NOT NULL THEN s.profile
              WHEN t.id_number IS NOT NULL THEN t.profile
            END AS profile,
            c.consult_id, 
            c.patient_name, 
            c.classes, 
            c.division, 
            c.hcr_name, 
            c.sick_type, 
            c.health_problem, 
            c.assignee, 
            c.date, 
            TIME_FORMAT(c.from_time, '%h:%i %p') AS from_time, 
            TIME_FORMAT(c.to_time, '%h:%i %p') AS to_time,  
            CASE
              WHEN s.id_number IS NOT NULL THEN TIMESTAMPDIFF(YEAR, s.dob, CURDATE())
              WHEN t.id_number IS NOT NULL THEN TIMESTAMPDIFF(YEAR, t.dob, CURDATE())
            END AS age, 
            d.work_experience, 
            d.profile AS doctor_profile, 
            CONCAT(d.dr_bachelor, ', ', d.dr_master) AS education 
          FROM tblconsulting c 
          INNER JOIN tbldoctor d ON c.doctor_id = d.doctor_id  
          LEFT JOIN tblstudent s ON s.id_number = c.id_number
          LEFT JOIN tblstaff t ON t.id_number = c.id_number 
          WHERE c.id_number = ?
        `;
      
        con.query(combinedView, id_number, (err, result) => {
          if (err) {
            console.error('Error fetching appointment details:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          const details = {staff:result}
      
          res.status(200).json(details);
        });
      });


      // GET endpoint to retrieve all appointment details with organization_name filter
app.get('/viewall_appointment_details', (req, res) => {
    res.header('Content-Type', 'application/json');
    const {organization_name} = req.query;

    try {
        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `SELECT c.status, c.consult_id, c.id_number, c.patient_name, c.sick_type, c.hcr_name, c.assignee, 
                       DATE_FORMAT(c.date, '%b %d') AS date, 
                       TIME_FORMAT(c.from_time, '%h:%i %p') AS from_time, 
                       TIME_FORMAT(c.to_time, '%h:%i %p') AS to_time 
                       FROM tblconsulting c
                       INNER JOIN tbluser u ON u.organization_name = c.organization_name`;

            if (organization_name) {
                sql += " WHERE c.organization_name = ?";
            }

            sql += " AND (c.is_deleted = 0 OR c.is_deleted IS NULL) ORDER BY c.consult_id DESC";

            con.query(sql, [organization_name], function(err, result) {
                if (err) throw err;
                console.log("Records viewed: " + JSON.stringify(result));
                res.status(200).json({ Result: "Success", message: "Data viewed successfully", result });
            });
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
    }
});



app.get('/consulting_datefilter', (req, res) => {
    res.header('Content-Type', 'application/json');
    
    const { startdate, enddate, organization_name } = req.query;
  
    // Prepare the date filter part of the SQL query
    let dateFilter = '';
    let orgFilter = '';
    const queryParams = [];
  
    if (startdate && enddate) {
      dateFilter = 'AND c.date BETWEEN ? AND ?';
      queryParams.push(startdate, enddate);
    }
  
    if (organization_name) {
      orgFilter = 'AND u.organization_name = ?';
      queryParams.push(organization_name);
    }
  
    const sql = `
      SELECT 
        c.status, 
        c.consult_id, 
        c.id_number, 
        c.patient_name, 
        c.sick_type, 
        c.hcr_name, 
        c.assignee, 
        CONCAT(DATE_FORMAT(c.date, '%b %d'), ' ', TIME_FORMAT(c.from_time, '%h:%i %p'), ' - ', TIME_FORMAT(c.to_time, '%h:%i %p')) AS date_time
      FROM 
        tblconsulting c
      INNER JOIN 
        tbluser u ON u.organization_name = c.organization_name
      WHERE 
        c.is_deleted = 0 
        ${dateFilter} 
        ${orgFilter}
      ORDER BY 
        c.consult_id DESC`;
  
    con.query(sql, queryParams, (err, result) => {
      if (err) {
        console.error('Error:', err);
        return res.status(500).json({ Result: "Failure", message: err.message });
      }
  
      console.log("Record view: " + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data viewed successfully", result });
    });
  });
  


      app.put('/edit_appointment_details', (req, res) => {
        res.header('Content-Type', 'application/json');
        try {
          const { id_number, patient_name, classes, division, health_problem, sick_type, hcr_name, assignee, date, from_time } = req.body;
      
          let status = 'new';
      
          var sql = "UPDATE tblconsulting SET patient_name=?, classes=?, division=?, health_problem=?, sick_type=?, hcr_name=?, assignee=?,  status=? WHERE id_number=?";
          con.query(sql, [patient_name || null, classes || null, division || null, health_problem || null, sick_type || null, hcr_name || null, assignee || null,   status || null, id_number || null], function (err, result) {
            if (err) {
              console.error('Error updating record:', err);
              res.status(500).json({ Result: "Failure", message: "Error updating record", error: err });
            } else {
              console.log("Record updated:", result.affectedRows);
              if (result.affectedRows === 0) {
                res.status(404).json({ Result: "Failure", message: "Record not found" });
              } else {
                res.status(200).json({ Result: "Success", message: "Data Updated Successfully" });
              }
            }
          });
        } catch (e) {
          console.error('Error:', e);
          res.status(500).json({ Result: "Failure", message: e.message });
        }
      });


      app.get('/viewall_medicineinventory', (req, res) => {
        res.header('Content-Type', 'application/json');
        
        const { organization_name } = req.query;
    
        try {
            let sql = `
                SELECT 
                    c.patient_name, 
                    c.id_number, 
                    c.consult_id, 
                    c.hcr_name, 
                    DATE_FORMAT(c.date, '%b %d, %Y') AS date,
                    p.prescriptiondetails_id,
                    p.consult_id, 
                    p.medicine_name,
                    m.hsn_code,
                    p.count   
                FROM 
                    tblconsulting c 
                INNER JOIN 
                    tblprescriptiondetails p ON p.consult_id = c.consult_id 
                INNER JOIN 
                    tblmedicine_list m ON m.medicine = p.medicine_name
                INNER JOIN 
                    tbluser u ON u.organization_name = c.organization_name`;
    
            if (organization_name) {
                sql += " WHERE c.organization_name = ?";
            }
    
            sql += " AND p.provided = 1";
    
            con.connect(function(err) {
                if (err) {
                    console.error('Error connecting to database:', err);
                    return res.status(500).json({ result: 'failure', message: 'Failed to connect to database' });
                }
    
                con.query(sql, [organization_name], (err, result) => {
                    if (err) {
                        console.error('Error executing query:', err);
                        return res.status(500).json({ result: 'failure', message: 'Internal Server Error' });
                    }
    
                    const medicineinventory = new Set();
                    const medicineDetailsSet = new Set();
    
                    result.forEach(row => {
                        medicineinventory.add(JSON.stringify({
                            patient_name: row.patient_name,
                            id_number: row.id_number,
                            consult_id: row.consult_id,
                            date: row.date,
                            hcr_name: row.hcr_name,
                        }));
    
                        medicineDetailsSet.add(JSON.stringify({
                            prescriptiondetails_id: row.prescriptiondetails_id,
                            consult_id: row.consult_id,
                            medicine_name: row.medicine_name,
                            hsn_code: row.hsn_code,
                            count: row.count,
                        }));
                    });
    
                    const medicineinventoryArray = Array.from(medicineinventory).map(JSON.parse);
                    const medicineDetailsArray = Array.from(medicineDetailsSet).map(JSON.parse);
    
                    res.status(200).json({
                        result: 'success',
                        message: 'Prescription Details Retrieved Successfully',
                        general_prescription: medicineinventoryArray,
                        medicine_details: medicineDetailsArray
                    });
                });
            });
        } catch (err) {
            console.error('Error:', err);
            res.status(500).json({ result: 'failure', message: err.message });
        }
    });
    

      // GET endpoint to retrieve medicine list with organization_name filter
app.get('/view_medicine_list', (req, res) => {
    res.header('Content-Type', 'application/json');
    const {organization_name} = req.query;

    try {
        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");

            let sql = `SELECT ml.* 
                       FROM tblmedicine_list ml
                       INNER JOIN tbluser u ON u.organization_name = ml.organization_name`;

            if (organization_name) {
                sql += " WHERE ml.organization_name = ?";
            }

            con.query(sql, [organization_name], function(err, result) {
                if (err) throw err;
                console.log("Records viewed: " + JSON.stringify(result));
                res.status(200).json({ Result: "Success", message: "Data viewed successfully", result });
            });
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ Result: "Failure", message: err.message });
    }
});


        

app.get('/inventory_datefilter', (req, res) => {
    res.header('Content-Type', 'application/json');
    
    const { startdate, enddate, organization_name } = req.query;
  
    // Prepare the date filter part of the SQL query
    let dateFilter = '';
    let params = [];
  
    if (startdate && enddate) {
      dateFilter = ' AND c.date BETWEEN ? AND ?';
      params.push(startdate, enddate);
    } else {
      return res.status(400).json({
        result: "failure",
        message: "Please provide valid start_date and end_date"
      });
    }
  
    // Include organization name in the query if provided
    let organizationFilter = '';
    if (organization_name) {
      organizationFilter = ' AND c.organization_name = ?';
      params.push(organization_name);
    }
  
    const sql = `
      SELECT 
        c.patient_name, 
        c.id_number, 
        c.consult_id, 
        c.hcr_name, 
        DATE_FORMAT(c.date, '%b %d, %Y') AS date,
        p.prescriptiondetails_id,
        p.consult_id, 
        p.medicine_name,
        m.hsn_code,
        m.quantity   
      FROM 
        tblconsulting c 
      INNER JOIN 
        tblprescriptiondetails p 
      ON 
        p.consult_id = c.consult_id 
      INNER JOIN 
        tblmedicine_list m 
      ON 
        m.medicine = p.medicine_name
      INNER JOIN 
        tbluser u 
      ON 
        u.organization_name = c.organization_name
      WHERE 
        p.provided = 1
        ${dateFilter}
        ${organizationFilter}`;  
  
    con.query(sql, params, (err, result) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ result: 'failure', message: 'Internal Server Error' });
      }
  
      const medicineinventory = new Set(); 
      const medicineDetailsSet = new Set();
  
      result.forEach(row => {
        medicineinventory.add(JSON.stringify({
          patient_name: row.patient_name,
          id_number: row.id_number,
          consult_id: row.consult_id,
          date: row.date,        
          hcr_name: row.hcr_name,
        }));
  
        medicineDetailsSet.add(JSON.stringify({
          medicine_name: row.medicine_name,
          hsn_code: row.hsn_code,        
          quantity: row.quantity,
        }));
      });
      
      const medicineinventoryArray = Array.from(medicineinventory).map(JSON.parse);
      const medicineDetailsArray = Array.from(medicineDetailsSet).map(JSON.parse);
  
      res.status(200).json({
        result: 'success',
        message: 'Prescription Details Retrieved Successfully',
        general_prescription: medicineinventoryArray,
        medicine_details: medicineDetailsArray
      });
    });
  });
      


        app.get('/viewbyid',async (req, res)=>{
            res.header('Content-Type', 'application/json');
            try {
              const {id}  = req.query;
              // Get a connection from the pool
              con.connect(function(err) {
                if (err) throw err;
                console.log("Connected!");
                var sql = `SELECT * FROM tbluser WHERE id =?`;
                  con.query(sql, [id], function (err, result) {
                  if (err) throw err;
                  console.log("1 record inserted");
                  res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
                });
              });
          
            } catch   (ex) {
              console.error('Error:', ex);
              res.status(500).json({ Result: "Failure", message: ex.message });
            }
          });


          app.get('/username',async (req, res)=>{
            res.header('Content-Type', 'application/json');
            try {
              const {id}  = req.query;
              // Get a connection from the pool
              con.connect(function(err) {
                if (err) throw err;
                console.log("Connected!");
                var sql = `SELECT username FROM tbluser WHERE id =?`;
                  con.query(sql, [id], function (err, result) {
                  if (err) throw err;
                  console.log("1 record inserted");
                  res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
                });
              });
          
            } catch   (ex) {
              console.error('Error:', ex);
              res.status(500).json({ Result: "Failure", message: ex.message });
            }
          });
  
          
          app.put('/newusername_password', (req, res) => {
            res.header('Content-Type', 'application/json');
            try {
              const { username, password, id } = req.body;
              console.log(username, password, id);
              
              // Get a connection from the pool
              con.connect(function(err) {
                if (err) throw err;
                console.log("Connected!");
                
                // Update the password and username in the database based on organization mobile number and email
                var sql = `UPDATE tbluser SET password=?, username=? WHERE id=?`;
                con.query(sql, [password, username, id], function(err, result) {
                  if (err) throw err;
                  console.log("Record updated successfully");
                  res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
                });
              });
            } catch (ex) {
              console.error('Error:', ex);
              res.status(500).json({ Result: "Failure", message: ex.message });
            }
          });

    
          app.put('/update_userprofile', (req, res) => {
            const { id, profile } = req.body;
          
            if (!id || !profile) {
                return res.status(400).json({ error: 'Missing id or profile data' });
            }
          
            const sql = `UPDATE tbluser SET profile=? WHERE id=?`;
          
            con.query(sql, [profile, id], (err, result) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                } else {
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: 'User not found' });
                    }
                    return res.status(200).json({ message: 'User profile updated successfully' });
                }
            });
          });  
          
          
          app.post('/contactus', async(req, res) => {
            const { name, email, message } = req.body;
          
            // Replace these with your actual email and SMTP server details
            var transporter = nodemailer.createTransport( {
              host: "smtp-mail.outlook.com", // hostname
              secureConnection: false, // TLS requires secureConnection to be false
              port: 587, // port for secure SMTP
              auth: {
                  user: "elanchezhian789@outlook.com",
                  pass: "90038elan"
              },
              tls: {
                  ciphers:'SSLv3'
              }
          });
            const mailOptions = {
                from: 'elanchezhian789@outlook.com',
                to: 'rockerelan@gmail.com',
                //to: email,
                subject: 'Medshyne Contact Us',
                message: message,
                text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
            };
            try {
              const info = await transporter.sendMail(mailOptions);
              console.log('Email sent:', info.response);
              res.status(200).json({ message: 'Email sent successfully!' });
          } catch (error) {
              console.error('Error sending email:', error);
              res.status(500).json({ error: 'Internal Server Error' });
          }
          });


          app.use(express.static('build'));

app.get('/', (req, res) => {
  // res.sendFile(__dirname + '/build/index.html');
});

function validateCreateUserInput(req, res, next) {
  const {
    organization_name,
    organization_type,
    email_id,
    organization_mobile_no,
    address,
    state,
    pincode,
    gst_number,
    count_of_student,
    count_of_staff,
    organisation_register_no,
    referral_username,
    how_hear_us,
    contact_name,
    designation,
    contact_email_id,
    contact_mobile_no,
    username,
    password,
    updated_by
  } = req.body;

  // Validation rules
  const validationRules = {
    organization_name: { required: true, type: 'string' },
    organization_type: { required: true, type: 'string' },
    email_id: { required: true, type: 'email' },
    organization_mobile_no: { required: true, type: 'string', pattern: /^\d{10}$/ },
    address: { required: true, type: 'string' },
    state: { required: true, type: 'string' },
    pincode: { required: true, type: 'string', pattern: /^\d{6}$/ },
    gst_number: { required: true, type: 'string' },
    count_of_student: { required: true, type: 'number' },
    count_of_staff: { required: true, type: 'number' },
    organisation_register_no: { required: true, type: 'string' },
    referral_username: { required: true, type: 'string' },
    how_hear_us: { required: true, type: 'string' },
    contact_name: { required: true, type: 'string' },
    designation: { required: true, type: 'string' },
    contact_email_id: { required: true, type: 'email' },
    contact_mobile_no: { required: true, type: 'string', pattern: /^\d{10}$/ },
    username: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
   
  };
  

  // Validate each field
  const errors = [];
  for (const field in validationRules) {
    const rule = validationRules[field];
    if (rule.required && !req.body[field]) {
      errors.push(`${field} is required.`);
    }
    if (req.body[field] && rule.type === 'email' && !isValidEmail(req.body[field])) {
      errors.push(`${field} should be a valid email.`);
    }
    if (req.body[field] && rule.pattern && !rule.pattern.test(req.body[field])) {
      errors.push(`${field} format is invalid.`);
    }
  }  

  // If there are errors, return a response with the error messages
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // If validation passes, proceed to the next middleware or route handler
  next();
}

// Example function to check if a string is a valid email address
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}



app.post('/createuser', async (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {organization_name, organization_type, email_id, organization_mobile_no, address, state, pincode, gst_number, count_of_student, count_of_staff, organisation_register_no, referral_username, how_hear_us, contact_name, designation, contact_email_id, contact_mobile_no, username, password, updated_by, } = req.body;

    const upload_doc =req.body.upload_doc;
    console.log(upload_doc);

    const isWhitespace = /\s/.test(username);
    if (isWhitespace) {
      return res.status(400).json({ Result: "Failure", message: "Username should not contain whitespace." });
    }

    // Get a connection from the pool
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      var sql = `INSERT INTO tbluser ( organization_name, organization_type, email_id, organization_mobile_no, address, state, pincode, gst_number, count_of_student, count_of_staff, organisation_register_no, referral_username, how_hear_us, contact_name, designation, contact_email_id, contact_mobile_no, username, password, doc, updated_by, updated_at,upload_doc) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, CURRENT_TIMESTAMP(),?)`;
      con.query(sql, [ organization_name, organization_type, email_id, organization_mobile_no, address, state, pincode, gst_number, count_of_student, count_of_staff, organisation_register_no, referral_username, how_hear_us, contact_name, designation, contact_email_id, contact_mobile_no, username, password, updated_by,upload_doc], function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
        res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
      });
    });    
   
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});


app.post('/saveotp', function (req, res) {
    res.header('Content-Type', 'application/json');
    try {
      const {email,otp}  = req.body;
      // Get a connection from the pool
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql =`Select * from tbluser where email_id = ?`;
          con.query(sql, [email], function (err, result) {
          if (err) throw err;
          console.log("1 selected");
         // res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
         let id =   result[0].id;
         console.log('ID FOR EMAIL',id);
         let sql1 = `UPDATE tbluser SET otp =? WHERE id =?`;
         con.query(sql1, [otp, id], function (err, resultUpdate) {
          if (err) throw err;
          console.log("1 record updated");
          res.status(200).json({ Result: "Success", message: "Data Updated Successfully", resultUpdate });
        });
      });
    });
      
    }
    catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }
  });


  app.post('/forgotpasswords', async(req, res) => {
    const { name, email, message } = req.body;
  
    // Replace these with your actual email and SMTP server details
    var transporter = nodemailer.createTransport( {
      host: "smtp-mail.outlook.com", // hostname
      secureConnection: false, // TLS requires secureConnection to be false
      port: 587, // port for secure SMTP
      auth: {
          user: "elanchezhian789@outlook.com",
          pass: "90038elan"
      },
      tls: {
          ciphers:'SSLv3'
      }
  });
    const mailOptions = {
        from: 'elanchezhian789@outlook.com',
       // to: 'rockerelan@gmail.com',
        to: email,
        subject: 'Medshyne Contact Us',
        message: message,
        text: `Name: ${name}\nEmail: ${email}\nOTP: ${message}`
    };
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
  });
    
  // organization login
app.post('/loginusername', (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
        const { username, password } = req.body;
        // Get a connection from the con
        con.connect(function (err) {
            if (err) {
                console.error("Error connecting to database:", err);
                return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
            }
            console.log("Connected to database!");
  
            var sql = `SELECT * FROM tbluser WHERE username = ? AND is_approved = 1`;
            con.query(sql, [username], function (err, result) {
                if (err) {
                    console.error("Error executing SQL query:", err);
                    return res.status(500).json({ Result: "Failure", message: "Error executing SQL query" });
                }
                if (result.length > 0) {
                    if (result[0].password === password) {
                        console.log("Login successful");
  
                        // Generate JWT token
                        const token = jwt.sign({ 
                            userId: result[0].id, 
                            username: result[0].username,  
                            profile: result[0].profile, 
                            organization_name: result[0].organization_name, 
                            organization_type: result[0].organization_type 
                        }, '605001', { expiresIn: '1h' });
  
                        // Include user details and token in the response
                        return res.status(200).json({ 
                            userId: result[0].id, 
                            username: result[0].username, 
                            profile: result[0].profile, 
                            organization_name: result[0].organization_name, 
                            organization_type: result[0].organization_type, 
                            token, 
                            Result: "Success", 
                            message: "Login successful" 
                        });
                    } else {
                        console.log("Login failed: Incorrect password");
                        return res.status(401).json({ Result: "Failure", message: "Login failed: Incorrect password" });
                    }
                } else {
                    console.log("Login failed: User not found");
                    return res.status(401).json({ Result: "Failure", message: "Login failed: User not found" });
                }
            });
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({ Result: "Failure", message: err.message });
    }
  });

  // Verify OTP and login
app.post('/verify_otp', async (req, res) => {
    const { otp } = req.body;
    
    const organization_mobile_no = req.session.mobileNumber;
    try {    
      const rows =  con.query('SELECT otp FROM tbluser WHERE organization_mobile_no = ?', [organization_mobile_no]);
      const savedOTP = rows.otp;
      if (otp === savedOTP) {
        // OTP verification successful
       res.json({ success: true, message: 'Login successful', organization_mobile_no });
      } else {
        res.status(401).json({ success: false, message: 'Invalid OTP' });
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).json({ success: false, error: 'Failed to verify OTP' });
    }
  });


  app.get('/getidfromemail', function (req, res) {
    res.header('Content-Type', 'application/json');
    try {
      const {email}  = req.query;
      // Get a connection from the pool
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql =`Select * from tbluser where email_id = ?`;
          con.query(sql, [email], function (err, result) {
          if (err) throw err;
          console.log("1 selected");
         res.status(200).json({ Result: "Success", message: "Data searched Successfully", result });
      });
    });
      
    }
    catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }
  });


  app.get('/getidfromphonenumber', function (req, res) {
    res.header('Content-Type', 'application/json');
    try {
      const {phonenumber}  = req.query;
      // Get a connection from the pool
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        var sql =`Select * from tbluser where organization_mobile_no = ?`;
          con.query(sql, [phonenumber], function (err, result) {
          if (err) throw err;
          console.log("1 selected");
         res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
      });
    });
      
    }
    catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
    }
  });


  app.post('/resetpassword', async(req, res) => {
    const { name, email, message } = req.body;
  
    // Replace these with your actual email and SMTP server details
    var transporter = nodemailer.createTransport( {
      host: "smtp-mail.outlook.com", // hostname
      secureConnection: false, // TLS requires secureConnection to be false
      port: 587, // port for secure SMTP
      auth: {
          user: "elanchezhian789@outlook.com",
          pass: "90038elan"
      },
      tls: {
          ciphers:'SSLv3'
      }
  });
    const mailOptions = {
        from: 'elanchezhian789@outlook.com',
       // to: 'rockerelan@gmail.com',
        to: email,
        subject: 'Medshyne Contact Us',
        message: message,
        text: `Name: ${name}\nEmail: ${email}\nOTP: ${message}`
    };
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
  });


  app.get('/viewbyid_prescription_before_provide', (req, res) => {
    res.header('Content-Type', 'application/json');
  
    try {
     
      const {consult_id} = req.query; 
      
      let selectPrescriptionQuery = `
      SELECT distinct
          COALESCE(s.profile, st.profile) AS profile,
          c.patient_name,
          c.id_number,
          CASE 
          WHEN s.id_number IS NOT NULL THEN CONCAT(s.classes,'/', s.division)
          ELSE CONCAT(st.department, '/', st.designation)
      END AS class,
          CASE
          WHEN s.dob IS NOT NULL THEN s.dob
          ELSE st.dob
      END AS dob,
      DATEDIFF(CURRENT_DATE(), 
               CASE
                   WHEN s.dob IS NOT NULL THEN s.dob
                   ELSE st.dob
               END) / 365 AS age,
          c.consult_id,
          DATE_FORMAT(c.date, '%d-%m-%y') AS date,
          CONCAT(DATE_FORMAT(c.from_time,'%h:%i %p'), ' - ', DATE_FORMAT(c.to_time,'%h:%i %p')) AS time,
          c.hcr_name,
          
          CASE WHEN p.mobile_number IS NOT NULL THEN p.mobile_number ELSE st.mobile_number END AS parent_mobile, 
          c.assignee,
          c.sick_type,
          c.health_problem,
          pd.prescriptiondetails_id,
          pd.medicine_name, 
          CONCAT_WS('-',
              CASE WHEN pd.period = 'morning' THEN '1' ELSE '0' END,
              CASE WHEN pd.period = 'afternoon' THEN '1' ELSE '0' END,
              CASE WHEN pd.period = 'evening' THEN '1' ELSE '0' END,
              CASE WHEN pd.period = 'night' THEN '1' ELSE '0' END
          ) AS periods,
          pd.symptom, 
          pd.days, 
          pd.food,
          pd.count,
          pd.prescription_status
      FROM 
          tblconsulting c
      INNER JOIN 
          tblprescriptiondetails pd ON pd.consult_id = c.consult_id
      LEFT JOIN 
          tblstudent s ON c.id_number = s.id_number
          
      LEFT JOIN 
          tblstaff st ON c.id_number = st.id_number
      LEFT JOIN 
          tblparent p ON p.id_number = s.id_number`;
  
      // If consult_id is provided, filter by it
      if (consult_id) {
        selectPrescriptionQuery += ' WHERE c.consult_id = ?';
      }
  
      console.log('SQL Query:', selectPrescriptionQuery); // Log SQL query
  
      // Execute the query with consult_id if provided
      con.query(selectPrescriptionQuery, [consult_id], (err, result) => {
        if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({
            result: 'failure',
            message: 'Internal Server Error'
          });
        }
  
        // Check if prescription details were found
        if (result.length === 0) {
          return res.status(404).json({
            result: 'failure',
            message: 'Prescription details not found'
          });
        }
  
        console.log('Prescription details retrieved successfully');
  
        const generalPrescriptionSet = new Set(); // Using a Set to ensure unique general prescription details
        const consultationDetailsSet = new Set(); // Using a Set to ensure unique consultation details
        const medicineDetailsSet = new Set(); // Using a Set to ensure unique medicine details
  
        result.forEach(row => {
          // Calculate age from date of birth
          const dob = new Date(row.dob);
          const ageDiffMs = Date.now() - dob.getTime();
          const ageDate = new Date(ageDiffMs);
          const age = Math.abs(ageDate.getUTCFullYear() - 1970);
  
          // Add general prescription details to the Set
          generalPrescriptionSet.add(JSON.stringify({
            profile: row.profile,
            patient_name: row.patient_name,
            id_number: row.id_number,
            class: row.class,
            age: age, 
            consult_id: row.consult_id,
            date: row.date,
            time: row.time,
            hcr_name: row.hcr_name,
            hcr_mobile_no: row.hcr_mobile_no,
            parent_mobile: row.parent_mobile,
            doctor_name: row.assignee,
            
          }));
  
          // Add consultation details to the Set
          consultationDetailsSet.add(JSON.stringify({
            sick_type: row.sick_type,
            health_problem: row.health_problem,
          }));
  
          // Add medicine details to the Set
          medicineDetailsSet.add(JSON.stringify({
            prescriptiondetails_id:row.prescriptiondetails_id,
            medicine_name: row.medicine_name,
            periods: row.periods,
            symptom: row.symptom,
            days: row.days,
            food: row.food,
            count: row.count,
            prescription_status: row.prescription_status,
          }));
        });
        
        // Convert Sets to Arrays
        const generalPrescriptionArray = Array.from(generalPrescriptionSet).map(JSON.parse);
        const genPresArray=[];
        let switched = false;
        for(let i=0;i<= generalPrescriptionArray.length-1;i++)
        {   
          if(generalPrescriptionArray.length ==1)
          {
            genPresArray.push(generalPrescriptionArray[i]);
            break;
          }
          if(switched)
          {
            switched= false;
            continue;
          }
          
          let lstIndex = generalPrescriptionArray.length-1;
          let j;
          
            if(i == generalPrescriptionArray.length-1)
            {
              console.log( ' LENGTH Check ', 'i ', i ,' j ', j);
              j = i;
            }
          
          else
          {
            console.log( 'i ', i ,' j ', j);
           j = i +1;
          }
        
          console.log('Total Length 0f generalPrescription Array : ',generalPrescriptionArray.length);
          if(generalPrescriptionArray[i].id_number==generalPrescriptionArray[j].id_number)
          {
            console.log('I is ',i , ' j is : ', j );
            genPresArray.push(generalPrescriptionArray[i]);
            switched= true;
          }           
        }
        const consultationDetailsArray = Array.from(consultationDetailsSet).map(JSON.parse);
        const medicineDetailsArray = Array.from(medicineDetailsSet).map(JSON.parse);
  
        res.status(200).json({
          result: 'success',
          message: 'Prescription Details Retrieved Successfully',
         // general_prescription: generalPrescriptionArray,
         general_prescription: genPresArray,
          consultation_details: consultationDetailsArray,
          medicine_details: medicineDetailsArray
        });
      });
    } catch (ex) {
      console.error('Exception:', ex);
      res.status(500).json({
        result: 'failure',
        message: 'Internal Server Error'
      });
    }
  });


  app.put('/pills_provided', (req, res) => {
    const checkboxUpdates = req.body;
  
    const promises = checkboxUpdates.map(update => {
        const { prescriptiondetails_id, provided } = update;
        return new Promise((resolve, reject) => {
            // Adjusting the checkboxValue based on provided value
            let checkboxValue = provided ? 2 : 0; // If provided is 1, set both provided and prescription_status as 2, else set both as 0
  
            const sql = 'UPDATE tblprescriptiondetails SET provided = ?, prescription_status = ? WHERE prescriptiondetails_id = ?';
            con.query(sql, [checkboxValue, checkboxValue, prescriptiondetails_id], (err, result) => {
                if (err) {
                    console.error(`Error updating checkbox ${prescriptiondetails_id} state:`, err);
                    reject(err);
                } else {
                    console.log(`Checkbox state updated for ID ${prescriptiondetails_id}`);
                    resolve(result);
                }
            });
        });
    });
  
    Promise.all(promises)
        .then(() => {
            res.status(200).json({ message: 'Checkbox states updated successfully' });
        })
        .catch((err) => {
            res.status(500).json({ error: 'Internal server error' });
        });
  });

  
  app.put('/update_quantity_and_provided', (req, res) => {
    // SQL query to update quantity in tblmedicine based on provide=1 and set provided=1 in tblprescriptiondetails
    const sql = `
        UPDATE tblmedicine_list m
        INNER JOIN tblprescriptiondetails p ON m.medicine = p.medicine_name
        SET 
            m.quantity = m.quantity - p.count,
            p.provided = 1
        WHERE p.provided = 2`;
  
    // Execute the SQL query
    con.query(sql, (err, result) => {
        if (err) {
            console.error('Error updating quantity and provided:', err);
            return res.status(500).json({ result: 'failure', message: 'Internal Server Error' });
        }
  
        const affectedRows = result ? result.affectedRows : 0;
        res.status(200).json({ result: 'success', message: `Quantity updated for ${affectedRows} medicines. Updated provided to 1 for ${affectedRows} prescriptions` });
    });
  });


  app.get('/recoveryviewall', (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
      // Get a connection from the pool
      con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
  
        // First SQL query for staff
        var sqlStaff = `SELECT profile, name, CONCAT(classes, '(', division,')') AS class_and_division, 'staff' AS roles, mobile_number, CONCAT(DATE_FORMAT(updated_at,'%b %d'), ' ') AS updated_at, id_number FROM tblstaff WHERE is_deleted = 1`;
        con.query(sqlStaff, function (err, staffResult) {
          if (err) throw err;
  
          // Second SQL query for students and their parents
          var sqlStudentsAndParents = `SELECT s.profile, s.name, CONCAT(s.classes, '(', s.division,')') AS class_and_division, 'student' AS roles, p.mobile_number, CONCAT(DATE_FORMAT(s.updated_at,'%b %d'), ' ') AS updated_at, s.id_number
                                       FROM tblstudent s 
                                       INNER JOIN tblparent p ON s.id_number = p.id_number 
                                       WHERE s.is_deleted = 1`;
          con.query(sqlStudentsAndParents, function (err, studentResult) {
            if (err) throw err;
  
            console.log("Records fetched successfully");
            // Combine staff and student results into a single response
            res.status(200).json({ Result: "Success", message: "Data view Successfully", data: [...staffResult, ...studentResult] });
          });
        });
      });
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    }
  });

  

  app.put('/recovery_student_and_staff', (req, res) => {
    const idNumber = req.body.id_number;
  
    // Get a connection from the pool
    con.connect(function(err) {
        if (err) {
            console.error('Error connecting to database:', err);
            res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
            return;
        }
  
        console.log("Connected!");
  
        // Use placeholders in the SQL query to prevent SQL injection
        const softDeleteSql = `
            UPDATE tblstudent
            SET is_deleted = 0
            WHERE id_number = ?`;
  
        // Use placeholders in the SQL query to prevent SQL injection for staff table as well
        const softDeleteStaffSql = `
        UPDATE tblstaff
        SET is_deleted = 0
        WHERE id_number = ?`;
  
        // Use transaction to ensure atomicity
        con.beginTransaction(function(err) {
            if (err) {
                console.error('Error starting transaction:', err);
                res.status(500).json({ Result: "Failure", message: "Failed to start transaction" });
                return;
            }
  
            // Soft delete student
            con.query(softDeleteSql, [idNumber], function (err, deleteStudentResult) {
                if (err) {
                    con.rollback(function() {
                        console.error('Error executing SQL query for student:', err);
                        res.status(500).json({ Result: "Failure", message: "Failed to soft delete student" });
                    });
                    return;
                }
  
                // Soft delete staff
                con.query(softDeleteStaffSql, [idNumber], function (err, deleteStaffResult) {
                    if (err) {
                        con.rollback(function() {
                            console.error('Error executing SQL query for staff:', err);
                            res.status(500).json({ Result: "Failure", message: "Failed to soft delete staff" });
                        });
                        return;
                    }
  
                    // Commit the transaction if both queries are successful
                    con.commit(function(err) {
                        if (err) {
                            con.rollback(function() {
                                console.error('Error committing transaction:', err);
                                res.status(500).json({ Result: "Failure", message: "Failed to commit transaction" });
                            });
                            return;
                        }
                        console.log(`Soft delete successful for student: ${deleteStudentResult.affectedRows} record(s), staff: ${deleteStaffResult.affectedRows} record(s)`);
  
                        // If soft delete is successful for both student and staff, return success message
                        res.status(200).json({ Result: "Success", message: "Soft delete successful for student and staff" });
                    });
                });
            });
        });
    });
  });


  app.post('/insert_appointment', (req, res) => {
    res.header('Content-Type', 'application/json');
    try { 
      const { id_number, patient_name, classes, division, health_problem, sick_type, hcr_name, doctor_id, assignee, from_time, organization_name } = req.body;
     
      let status = 'new';
      let currentDate = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD format
  
      var sql = `INSERT INTO tblconsulting (id_number, patient_name, classes, division, health_problem, sick_type, hcr_name, doctor_id, assignee, date, from_time, status, is_deleted, organization_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,0, ?)`;
      
      con.query(sql, [id_number || null, patient_name || null, classes || null, division || null, health_problem || null, sick_type || null, hcr_name || null, doctor_id || null, assignee || null, currentDate || null, from_time || null, status || null, organization_name || null], function (err, result) {
        if (err) {
          console.error('Error:', err);
          return res.status(500).json({ Result: "Failure", message: err.message });
        }
        console.log("Record inserted: ", JSON.stringify(result));
        res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
      });
    } catch (e) {
      console.error('Error:', e);
      res.status(500).json({ Result: "Failure", message: e.message });
    }
  });



  app.get('/consulting_detail', (req, res) => {
    res.header('Content-Type', 'application/json');
    const {id_number} = req.query;
    console.log(id_number);
  
    // Define SQL queries to fetch details from student and staff tables based on ID number
    const combinedQuery = `
    SELECT name, classes, division 
    FROM tblstudent 
    WHERE id_number = ?
    UNION
    SELECT name, classes, division 
    FROM tblstaff 
    WHERE id_number = ?
  `;
    // const staffQuery = 'SELECT name, classes, division FROM tblstaff WHERE id_number = ?';
  
    con.query(combinedQuery, [id_number, id_number], (err, results) => {
      if (err) {
        console.error('Error fetching details:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
    
      // Assuming there's only one matching result
      const detail = results[0] || null;
    
      res.status(200).json(detail);
    });
  });


  app.get('/get_staffprofile_by_id', async (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
      const { id_number } = req.query;
      // Get a connection from the pool
      con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
        var sql = `SELECT     
        id,
        designation,
        department,
        updated_at,
        profile,
        current_health_report,
        past_health_report,
        name,
        id_number,
        address,
        allergies_define,
        any_disease_define,
        classes,
        division,
        blood_group,
        gender,
        dob,
        mobile_number,
        allergies,
        any_disease,
        hcr
    FROM 
        tblstaff
    where id_number = ? AND (is_deleted = 0 OR is_deleted IS NULL)`;
        con.query(sql, [id_number], function (err, result) {
          if (err) throw err;
          console.log("1 record shown");
          console.log('Result of staff Query ', result.length, '     ', result);
          if (result.length > 0) {
            res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
          } else {
            res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
          }
        });
      });
  
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    }
  });


  app.put('/updatestaff', (req, res) => {
    res.header('Content-Type', 'application/json');
  
    try {
      const {
        profile, name, id_number, address, gender, state, pincode, classes, division, dob, blood_group, designation,department, allergies, allergies_define, any_disease, any_disease_define, current_health_report, past_health_report, mobile_number, hcr,updated_by, updated_at
      } = req.body;

  
      con.connect(function (err) {
        if (err) {
          console.error('Error connecting to database:', err);
          return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
        }
  
        console.log("Connected to database!");
        var sql = `UPDATE tblstaff 
                   SET profile = ?, name = ?, address = ?, gender = ?, state = ?, pincode = ?, classes = ?, division = ?, dob = ?, blood_group = ?,designation = ?, department = ?, allergies = ?, allergies_define = ?, any_disease = ?, any_disease_define = ?, current_health_report = ?, past_health_report = ?, mobile_number = ?, hcr = ?, updated_by = ?,updated_at = NOW()
                   WHERE id_number = ?`;
  
        con.query(sql, [profile || null, name || null, address || null, gender || null, state || null, pincode || null, classes || null, division || null, dob || null, blood_group || null, designation || null, department || null, allergies || null, allergies_define || null, any_disease || null, any_disease_define || null, current_health_report || null, past_health_report || null,mobile_number || null, hcr || null, updated_by || null, updated_at || null, id_number],
  
          function (err, result) {
            if (err) {
              console.error('Error executing SQL query:', err);
              return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
            }
  
            if (result.affectedRows === 0) {
              return res.status(404).json({ Result: "Failure", message: "Saff not found" });
            }
  
            console.log("1 record updated");
            res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
          });
      });
  
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    }
  });


  app.post('/staffdetails', (req, res) => {
    res.header('Content-Type', 'application/json');
  
    try {
      const {
        profile, name, id_number, password, address, gender, state, pincode, classes, division, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, current_health_report, past_health_report, mobile_number, hcr,updated_at, updated_by, organization_name
      } = req.body;
  
      // Determine role based on hcr
      const role = (hcr === 1) ? "hcr" : "staff";
  
      con.connect(function (err) {
        if (err) {
          console.error('Error connecting to database:', err);
          return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
        }
  
        console.log("Connected to database!");
        var sql = `INSERT INTO tblstaff (profile, name, id_number, password, address, gender, state, pincode, classes, division, dob, blood_group, designation, department, allergies, allergies_define, any_disease, any_disease_define, current_health_report, past_health_report, mobile_number, hcr, updated_at, updated_by, organization_name, role,) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now(),?, ?, ?)`;
  
        con.query(sql, [profile || null, name || null, id_number || null, password || null, address || null, gender || null, state || null, pincode || null, classes || null, division || null, dob || null, blood_group || null, designation || null, department || null, allergies || null, allergies_define || null, any_disease || null, any_disease_define || null, current_health_report || null, past_health_report || null, mobile_number || null, hcr || null, updated_at || null, updated_by || null, organization_name || null, role || null],
  
          function (err, result) {
            if (err) {
              console.error('Error executing SQL query:', err);
              return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
            }
  
            console.log("1 record inserted");
            res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
          });
      });
  
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    }
  });




  app.get('/softdelete_staff', (req, res) => {
    const {idNumber} = req.query;
    
    // Get a connection from the pool
    con.connect(function(err) {
        if (err) {
            console.error('Error connecting to database:', err);
            res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
            return;
        }
        
        console.log("Connected!");
        
        // Use placeholders in the SQL query to prevent SQL injection
        const selectSql = 
        `SELECT profile, name, role,CONCAT(classes,'(',division,')') AS class_and_division , mobile_number
          FROM tblstaff
          WHERE id_number = ?`;
        
        // Use parameterized query to avoid SQL injection
        con.query(selectSql, [idNumber], function (err, selectResult) {
            if (err) {
                console.error('Error executing SQL query:', err);
                res.status(500).json({ Result: "Failure", message: "Failed to fetch student details" });
            } else if (selectResult.length > 0) {
                const studentDetails = selectResult[0]; // Assuming only one student is returned
                
                // Soft delete student
                const softDeleteSql = 
                `UPDATE tblstaff
                SET is_deleted = 1
                WHERE id_number = ?`;
                
                // Use parameterized query to avoid SQL injection
                con.query(softDeleteSql, [idNumber], function (err, deleteResult) {
                    if (err) {
                        console.error('Error executing SQL query:', err);
                        res.status(500).json({ Result: "Failure", message: "Failed to soft delete student" });
                    } else if (deleteResult.affectedRows > 0) {
                        console.log("Soft delete successful for ${deleteResult.affectedRows} record(s)");
            
                        // If soft delete is successful, return a success message along with student details
                        res.status(200).json({ Result: "Success", message: "Soft delete successful", student: studentDetails });
                    } else {
                        // If no rows were affected, the record might not exist or already be soft-deleted
                        res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
                    }
                });
            } else {
                res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
            }
        });
    });
  });


  app.get('/viewallstaff', (req, res) => {
    res.header('Content-Type', 'application/json');
    
    const { organization_name } = req.query;

    try {
        // Get a connection from the pool
        con.connect(function(err) {
            if (err) {
                console.error('Error connecting to database:', err);
                return res.status(500).json({ Result: "Failure", message: "Failed to connect to database" });
            }
            
            console.log("Connected!");
            var sql = `
                SELECT 
                    s.id, 
                    s.id_number, 
                    s.profile, 
                    s.name, 
                    s.designation, 
                    CASE WHEN s.hcr = 1 THEN 'yes' ELSE 'no' END AS hcr, 
                    s.mobile_number, 
                    DATE_FORMAT(s.updated_at, '%b %d') AS updated_at 
                FROM 
                    tblstaff s 
                INNER JOIN 
                    tbluser u ON u.organization_name = s.organization_name`;

            if (organization_name) {
                sql += " WHERE s.organization_name = ? AND (s.is_deleted = 0 OR s.is_deleted IS NULL)";
            } 
            sql += " ORDER BY s.id DESC";

            con.query(sql, [organization_name], function (err, result) {
                if (err) {
                    console.error('Error executing query:', err);
                    return res.status(500).json({ Result: "Failure", message: "Internal Server Error" });
                }

                console.log("Records retrieved successfully");
                res.status(200).json({ Result: "Success", message: "Data view Successfully", result });
            });
        });
    } catch (ex) {
        console.error('Error:', ex);
        res.status(500).json({ Result: "Failure", message: ex.message });
    }
});



  
  app.get('/consulting_staffprofile_by_id', (req, res) => {
    const {idNumber} = req.query;
    
    // Get a connection from the pool
    con.connect(function(err) {
        if (err) {
            console.error('Error connecting to database:', err);
            res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
            return;
        }
        console.log("Connected!");  
        // Use placeholders in the SQL query to prevent SQL injection
        const sql = `
        SELECT 
            st.designation,
            st.name,
            st.profile,
            st.id_number,
            st.department,
            DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),st.dob)), '%Y') + 0 AS age,
            st.gender,
            st.blood_group,
            st.address,
            st.mobile_number,
            st.allergies_define,
            st.any_disease_define,
            st.current_health_report,
            st.past_health_report,
            d.sick_type,
            d.consult_id,
            CONCAT(st.classes, '/', st.division) AS class_and_division,
            d.id_number,
            d.id_number AS hcr_id,
            d.assignee,
            d.hcr_name,
            CONCAT(d.from_time, ' - ', d.to_time) AS time,
            DATE_FORMAT(d.date, '%b %e,%Y') AS formatted_date_time
            
        FROM 
            tblstaff st
        LEFT JOIN 
            tblconsulting d ON st.id_number = d.id_number
        WHERE 
            st.id_number = ? `;
        
        // Use parameterized query to avoid SQL injection
        con.query(sql, [idNumber], function (err, result) {
            if (err) {
                console.error('Error executing SQL query:', err);
                res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
                return;
            } 
            if (result.length > 0) {
                console.log(`${result.length} records fetched`);
                
                // Organizing data into separate arrays
                const firstArray = [];
                const secondArray = [];
                let j = 0;
                for (let i = 0; i < result.length; i++) {
                    const item = result[i];
                    j = i + 1;
                  
                    if(result.length == 1) {
                        // Push data to firstArray
                        firstArray.push({
                            name: item.name, 
                            profile: item.profile,
                            id_number: item.id_number,
                            designation: item.designation
                        });
                        continue;
                    }
                    if(result.length > 1 && j < result.length) {
                        console.log(result[i].id,'    ',result[j].id);
                        if (i == 0) { 
                            firstArray.push({
                                name: item.name, 
                                profile: item.profile,
                                id_number: item.id_number,
                                designation: item.designation
                            });
                            continue;
                        } else {
                            if (result[i].id != result[j].id) {
                                firstArray.push({
                                    name: item.name, 
                                    profile: item.profile,
                                    id_number: item.id_number,
                                    designation: item.designation
                                });
                            }
                        }
                    }
                }
  
                //secondArray loop
  
                // Push data to secondArray
                let k = 0;
                for (let m = 0; m < result.length; m++) {
                    const item = result[m];
                    k = m + 1;
                  
                    if(result.length == 1) {
                        // Push data to firstArray
                        secondArray.push({
                            name: item.name,
                            department: item.department,
                            age: item.age,
                            gender: item.gender,
                            blood_group: item.blood_group,
                            class_and_division: item.class_and_division,
                            address: item.address,
                            mobile_number: item.mobile_number,
                            allergies_define: item.allergies_define,
                            any_disease_define: item.any_disease_define,
                            current_health_report: item.current_health_report,
                            past_health_report: item.past_health_report
                        });
                        continue;
                    }
                    if(result.length > 1 && k < result.length) {
                        console.log(result[m].id,'    ',result[k].id);
                        if (m == 0) { 
                            secondArray.push({
                                name: item.name,
                                department: item.department,
                                age: item.age,
                                gender: item.gender,
                                blood_group: item.blood_group,
                                class_and_division: item.class_and_division,
                                address: item.address,
                                mobile_number: item.mobile_number,
                                allergies_define: item.allergies_define,
                                any_disease_define: item.any_disease_define,
                                current_health_report: item.current_health_report,
                                past_health_report: item.past_health_report
                            });
                            continue;
                        } else {
                            if (result[m].id != result[k].id) {
                                secondArray.push({
                                    name: item.name,
                                    department: item.department,
                                    age: item.age,
                                    gender: item.gender,
                                    blood_group: item.blood_group,
                                    class_and_division: item.class_and_division,
                                    address: item.address,
                                    mobile_number: item.mobile_number,
                                    allergies_define: item.allergies_define,
                                    any_disease_define: item.any_disease_define,
                                    current_health_report: item.current_health_report,
                                    past_health_report: item.past_health_report
                                });
                            }
                        }
                    }
                }
  
                // Organizing data into consultingArray (outside the loop)
                const consultingArray = result.map(item => ({
                    name: item.name,
                    sick_type: item.sick_type,
                    consult_id: item.consult_id,
                    class_and_division: item.class_and_division,
                    id_number: item.id_number,
                    hcr_id: item.hcr_id,
                    assignee: item.assignee,
                    hcr_name: item.hcr_name,
                    time: item.time,
                    date_time: item.formatted_date_time,
                    mobile_number: item.mobile_number
                }));
  
                res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", firstArray, secondArray, consultingArray });
            } else {
                res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
            }
        });
    });
  });



  app.get('/get_studentprofile_by_id', async (req, res) => {
    res.header('Content-Type', 'application/json');
    try {
      const { id_number } = req.query;
  
      // Get a connection from the pool
      con.connect(function (err) {
        if (err) throw err;
        console.log("Connected!");
  
        var sql = 
         ` SELECT     
            s.profile, s.current_health_report, s.past_health_report, s.name AS student_name, s.id_number,
            s.address, s.allergies_define, s.any_disease_define, s.classes, s.division,
            s.blood_group, s.gender, s.dob, s.allergies, s.any_disease, s.updated_at,
            father.parent_name AS father_name, father.mobile_number AS father_mobile,
            mother.parent_name AS mother_name, mother.mobile_number AS mother_mobile,
            father.relation AS father_relation, mother.relation AS mother_relation
          FROM 
            tblstudent s
            LEFT JOIN tblparent father ON s.id_number = father.id_number AND father.relation = 'father' 
            LEFT JOIN tblparent mother ON s.id_number = mother.id_number AND mother.relation = 'mother'
          WHERE s.id_number = ? AND (s.is_deleted = 0 OR s.is_deleted IS NULL)`;
  
        con.query(sql, [id_number], function (err, result) {
          if (err) throw err;
          console.log("1 record shown");
          console.log('Result of student Query ', result.length, '     ', result);
          
          if (result.length > 0) {
            const studentData = {
              profile: result[0].profile,
              current_health_report: result[0].current_health_report,
              past_health_report: result[0].past_health_report,
              name: result[0].student_name,
              id_number: result[0].id_number,
              address: result[0].address,
              allergies_define: result[0].allergies_define,
              any_disease_define: result[0].any_disease_define,
              classes: result[0].classes,
              division: result[0].division,
              blood_group: result[0].blood_group,
              gender: result[0].gender,
              dob: result[0].dob,
              allergies: result[0].allergies,
              any_disease: result[0].any_disease,
              updated_at: result[0].updated_at
            };
  
            const parentData = [];
            if (result[0].father_mobile) {
              parentData.push({ 
                relation: result[0].father_relation, 
                name: result[0].father_name,
                mobile_number: result[0].father_mobile 
              });
            }
            if (result[0].mother_mobile) {
              parentData.push({ 
                relation: result[0].mother_relation, 
                name: result[0].mother_name,
                mobile_number: result[0].mother_mobile 
              });
            }
  
            res.status(200).json({ 
              Result: "Success", 
              message: "Data view Successfully", 
              student: studentData, 
              parents: parentData 
            });
          } else {
            res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
          }
        });
      });
  
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    }
  });


  app.put('/updatestudent', (req, res) => {
    res.header('Content-Type', 'application/json');
  
    try {
      const {
        profile, name, id_number, address, gender, state, pincode, classes, division, dob, blood_group, department, allergies, allergies_define, any_disease, any_disease_define, current_health_report, past_health_report, updated_by, organization_name
      } = req.body;

  
      con.connect(function (err) {
        if (err) {
          console.error('Error connecting to database:', err);
          return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
        }
  
        console.log("Connected to database!");
        var sql = `UPDATE tblstudent 
                   SET profile = ?, name = ?, address = ?, gender = ?, state = ?, pincode = ?, classes = ?, division = ?, dob = ?, blood_group = ?, department = ?, allergies = ?, allergies_define = ?, any_disease = ?, any_disease_define = ?, current_health_report = ?, past_health_report = ?, updated_by = ?, organization_name = ?, updated_at = now()
                   WHERE id_number = ?`;
  
        con.query(sql, [profile || null, name || null, address || null, gender || null, state || null, pincode || null, classes || null, division || null, dob || null, blood_group || null, department || null, allergies || null, allergies_define || null, any_disease || null, any_disease_define || null, current_health_report || null, past_health_report || null, updated_by || null, organization_name || null, id_number],
  
          function (err, result) {
            if (err) {
              console.error('Error executing SQL query:', err);
              return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
            }
  
            if (result.affectedRows === 0) {
              return res.status(404).json({ Result: "Failure", message: "Student not found" });
            }
  
            console.log("1 record updated");
            res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
          });
      });
  
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    }
  });


  app.post('/studentdetails', (req, res) => {
    res.header('Content-Type', 'application/json');
  
    try {
      const {
        profile, name, id_number,  address, gender, state, pincode, classes, division, dob, blood_group, department, allergies, allergies_define, any_disease, any_disease_define, current_health_report, past_health_report,  updated_by, organization_name, updated_at
      } = req.body;
  
  
      con.connect(function (err) {
        if (err) {
          console.error('Error connecting to database:', err);
          return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
        }
  
        console.log("Connected to database!");
        var sql = `INSERT INTO tblstudent (profile, name, id_number,address, gender, state, pincode, classes, division, dob, blood_group, department, allergies, allergies_define, any_disease, any_disease_define, current_health_report, past_health_report, updated_by, organization_name, updated_at) 
        VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, now())`;
  
        con.query(sql, [profile || null, name || null, id_number ||  null, address || null, gender || null, state || null, pincode || null, classes || null, division || null, dob || null, blood_group ||  null, department || null, allergies || null, allergies_define || null, any_disease || null, any_disease_define || null, current_health_report || null, past_health_report || null, updated_by || null, organization_name || null, updated_at || null],
  
          function (err, result) {
            if (err) {
              console.error('Error executing SQL query:', err);
              return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
            }
  
            console.log("1 record inserted");
            res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
          });
      });
  
    } catch (ex) {
      console.error('Error:', ex);
      res.status(500).json({ Result: "Failure", message: ex.message });
    }
  });




  // app.get('/viewallstudent',async (req, res)=>{
  
  //   res.header('Content-Type', 'application/json');
  //   try {
  //     // Get a connection from the con
  //     con.connect(function(err) {
  //       if (err) throw err;
  //       console.log("Connected!");
  //       var sql = `SELECT s.id_number, c.HCR, s.profile, s.name, CONCAT(s.classes, '(', s.division, ')') AS division, CASE
  //       WHEN father.mobile_number IS NOT NULL THEN father.mobile_number
  //       ELSE NULL 
  //       END AS parent_mobile_number, 
  //       DATE_FORMAT(s.updated_at, '%b %d') AS last_update FROM tblstudent s 
  //       LEFT JOIN tblparent father ON s.id_number = father.id_number AND father.relation = 'father'
  //       LEFT JOIN tblclasses c ON s.id_number = c.id_number WHERE s.is_deleted = 0   ORDER BY s.id DESC`;
  //         con.query(sql, function (err, result) {
  //         if (err) throw err;
  //         console.log("1 record inserted");
  //         res.status(200).json({ Result: "Success", message: "All data view Successfully", result });
  //       });
  //     });
  //   }catch   (ex) {
  //     console.error('Error:', ex);
  //     res.status(500).json({ Result: "Failure", message: ex.message });
  //   }
  //   });


  app.get('/viewallstudent', (req, res) => {
    res.header('Content-Type', 'application/json');
    
    const { organization_name } = req.query;

    try {
        // Get a connection from the pool
        con.connect(function(err) {
            if (err) {
                console.error('Error connecting to database:', err);
                return res.status(500).json({ Result: "Failure", message: "Failed to connect to database" });
            }
            
            console.log("Connected!");
            var sql = `
                SELECT 
                    s.id_number, 
                    c.HCR, 
                    s.profile, 
                    s.name, 
                    CONCAT(s.classes, '(', s.division, ')') AS division, 
                    CASE
                        WHEN father.mobile_number IS NOT NULL THEN father.mobile_number
                        ELSE NULL 
                    END AS parent_mobile_number, 
                    DATE_FORMAT(s.updated_at, '%b %d') AS last_update 
                FROM 
                    tblstudent s 
                INNER JOIN 
                    tbluser u ON u.organization_name = s.organization_name
                LEFT JOIN 
                    tblparent father ON s.id_number = father.id_number AND father.relation = 'father'
                LEFT JOIN 
                    tblclasses c ON s.id_number = c.id_number 
                WHERE 
                    s.organization_name = ?
                    AND (s.is_deleted = 0 OR s.is_deleted IS NULL) 
                ORDER BY 
                    s.id DESC`;

            con.query(sql, [organization_name], function (err, result) {
                if (err) {
                    console.error('Error executing query:', err);
                    return res.status(500).json({ Result: "Failure", message: "Internal Server Error" });
                }

                console.log("Records retrieved successfully");
                res.status(200).json({ Result: "Success", message: "All data view Successfully", result });
            });
        });
    } catch (ex) {
        console.error('Error:', ex);
        res.status(500).json({ Result: "Failure", message: ex.message });
    }
});


    app.get('/softdelete_student', (req, res) => {
        const {idNumber} = req.query;
    
        // Use the connection pool to get a connection
        con.connect((err, con) => {
            if (err) {
                console.error('Error getting connection from pool:', err);
                res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
                return;
            }
    
            console.log("Connected!");
    
            // Use placeholders in the SQL query to prevent SQL injection
            const selectSql = 
               ` SELECT profile, name, role, CONCAT(classes, '(', division, ')') AS class_and_division
                FROM tblstudent
                WHERE id_number = ?`
            ;
    
            con.query(selectSql, [idNumber], (err, selectResult) => {
    
                if (err) {
                    console.error('Error executing SQL query:', err);
                    res.status(500).json({ Result: "Failure", message: "Failed to fetch student details" });
                    return;
                }
    
                if (selectResult.length > 0) {
                    // Use placeholders in the SQL query to prevent SQL injection
                    const softDeleteSql = 
                        `UPDATE tblstudent
                        SET is_deleted = 1
                        WHERE id_number = ?`
                    ;
    
                    con.query(softDeleteSql, [idNumber], (err, deleteResult) => {
                        if (err) {
                            console.error('Error executing SQL query:', err);
                            res.status(500).json({ Result: "Failure", message: "Failed to soft delete student" });
                            return;
                        }
    
                        if (deleteResult.affectedRows > 0) {
                            console.log(`Soft delete successful for ${deleteResult.affectedRows} record(s)`);
                            res.status(200).json({ Result: "Success", message: "Soft delete successful" });
                        } else {
                            res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
                        }
                    });
                } else {
                    res.status(404).json({ Result: "Failure", message: "No student found with the provided id_number" });
                }
            });
    
        });
    });

    

    // app.get('/consulting_studentprofile_by_id', (req, res) => {
    //     const {idNumber} = req.query;
      
    //     // Get a connection from the pool
    //     con.connect(function(err) {
    //       if (err) {
    //         console.error('Error connecting to database:', err);
    //         res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
    //         return;
    //       }
    //       console.log("Connected!");
    //       // Use placeholders in the SQL query to prevent SQL injection
    //       const sql = `
    //         SELECT
    //           d.assignee,
    //           d.consult_id,
    //           d.sick_type,
    //           DATE_FORMAT(d.date, '%b %e,%Y') AS formatted_date_time,
    //           stf.id_number as staff_id_number, 
    //           c.HCR,
    //           hp.mobile_number,
    //           hp.parent_name,
    //           s.profile,
    //           s.name,
    //           s.id_number,
    //           s.address,
    //           s.allergies_define,
    //           s.any_disease_define,
    //           CONCAT(s.classes, '/', s.division AS class_and_division,
    //           CONCAT(d.from_time, ' - ', d.to_time) AS time,
    //           s.blood_group,
    //           s.gender,
    //           DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),s.dob)), '%Y') + 0 AS age
    //         FROM
    //           tblstudent s
    //         INNER JOIN
    //           tblparent hp ON hp.id_number = s.id_number  
    //         INNER JOIN
    //           tblclasses c ON c.division = s.division AND c.classes_name = s.classes
    //         INNER JOIN
    //           tblstudent s ON s.id_number = hp.id_number
    //         INNER JOIN
    //           tblconsulting d ON d.id_number = s.id_number
    //         INNER JOIN
    //           tblstaff stf ON stf.name = c.HCR
    //         WHERE
    //           s.id_number=?
    //       `;
      
    //       // Use parameterized query to avoid SQL injection
    //       con.query(sql, [idNumber], function (err, result) {
    //         if (err) {
    //           console.error('Error executing SQL query:', err);
    //           res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
    //           return;
    //         }
    //         if (result.length > 0) {
    //           console.log(`${result.length} records fetched`);
      
    //           // Organizing data into separate arrays
    //           const firstArray = [];
    //           const secondArray = [];
    //           let j = 0;
    //           for (let i = 0; i < result.length; i++) {
    //             const item = result[i];
    //             j = i + 1;
      
    //             if(result.length == 1) {
    //               // Push data to firstArray
    //               firstArray.push({
    //                 name: item.name,
    //                 profile: item.profile,
    //                 id_number: item.id_number
    //               });
    //               continue;
    //             }
    //             if(result.length > 1 && j < result.length) {
    //               console.log(result[i].id_number,'    ',result[j].id_number);
    //               if (i == 0) {
    //                 firstArray.push({
    //                   name: item.name,
    //                   profile: item.profile,
    //                   id_number: item.id_number
    //                 });
    //                 continue;
    //               } else {
    //                 if (result[i].id_number != result[j].id_number) {
    //                   firstArray.push({
    //                     name: item.name,
    //                     profile: item.profile,
    //                     id_number: item.id_number
    //                   });
    //                 }
    //               }
    //             }
    //           }
      
    //           // Push data to secondArray
    //           let k = 0;
    //           for (let m = 0; m < result.length; m++) {
    //             const item = result[m];
    //             k = m + 1;
      
    //             if(result.length == 1) {
    //               // Push data to firstArray
    //               secondArray.push({
    //                 name: item.name,
    //                 sick_type: item.sick_type,
    //                 department: item.hcr_name,
    //                 age: item.age,
    //                 gender: item.gender,
    //                 blood_group: item.blood_group,
    //                 class_and_division: item.class_and_division,
    //                 address: item.address,
    //                 mobile_number: item.mobile_number,
    //                 parent_name: item.parent_name,
    //                 allergies_define: item.allergies_define,
    //                 any_disease_define: item.any_disease_define,
    //                 current_health_report: item.current_health_report,
    //                 past_health_report: item.past_health_report
    //               });
    //               continue;
    //             }
    //             if(result.length > 1 && k < result.length) {
    //               console.log(result[m].id_number,'    ',result[k].id_number);
    //               if (m == 0) {
    //                 secondArray.push({
    //                   name: item.name,
    //                   sick_type: item.sick_type,
    //                   department: item.hcr_name,
    //                   age: item.age,
    //                   gender: item.gender,
    //                   blood_group: item.blood_group,
    //                   class_and_division: item.class_and_division,
    //                   address: item.address,
    //                   mobile_number: item.mobile_number,
    //                   parent_name: item.parent_name,
    //                   allergies_define: item.allergies_define,
    //                   any_disease_define: item.any_disease_define,
    //                   current_health_report: item.current_health_report,
    //                   past_health_report: item.past_health_report
    //                 });
    //                 continue;
    //               } else {
    //                 if (result[m].id_number != result[k].id_number) {
    //                   secondArray.push({
    //                     name: item.name,
    //                     sick_type: item.sick_type,
    //                     department: item.hcr_name,
    //                     age: item.age,
    //                     gender: item.gender,
    //                     blood_group: item.blood_group,
    //                     class_and_division: item.class_and_division,
    //                     address: item.address,
    //                     mobile_number: item.mobile_number,
    //                     parent_name: item.parent_name,
    //                     allergies_define: item.allergies_define,
    //                     any_disease_define: item.any_disease_define,
    //                     current_health_report: item.current_health_report,
    //                     past_health_report: item.past_health_report
    //                   });
    //                 }
    //               }
    //             }
    //           }
      
    //           // Organizing data into thirdArray (outside the loop)
    //           const thirdArray = result.map(item => ({
    //             name: item.name,
    //             sick_type: item.sick_type,
    //             consult_id: item.consult_id,
    //             class_and_division: item.class_and_division,
    //             id_number: item.id_number,
    //             assignee: item.assignee,
    //             hcr_name: item.HCT,
    //             time: item.time,
    //             date_time: item.formatted_date_time
    //           }));
      
    //           res.status(200).json({ Result: "Success", message: "Data Fetched Successfully",
    //             firstArray, secondArray, thirdArray });
    //         } else {
    //           res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
    //         }
    //       });
    //     });
    //   });

  
    //   const { idNumber } = req.query;
    
    //   if (!idNumber) {
    //     return res.status(400).json({ Result: "Failure", message: "idNumber is required" });
    //   }
    
    //   const sql = `
    //     SELECT
    //       d.assignee,
    //       d.consult_id,
    //       d.sick_type,
    //       DATE_FORMAT(d.date, '%b %e, %Y') AS formatted_date_time,
    //       stf.id_number as staff_id_number, 
    //       c.HCR AS hcr_name,
    //       hp.mobile_number,
    //       hp.parent_name,
    //       s.profile,
    //       s.name,
    //       s.id_number,
    //       s.address,
    //       s.allergies_define,
    //       s.any_disease_define,
    //       CONCAT(s.classes, '/', s.division) AS class_and_division,
    //       CONCAT(d.from_time, ' - ', d.to_time) AS time,
    //       s.blood_group,
    //       s.gender,
    //       DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), s.dob)), '%Y') + 0 AS age
    //     FROM
    //       tblparent hp
    //     INNER JOIN
    //       tblstudent s ON s.id_number = hp.id_number
    //     INNER JOIN
    //       tblclasses c ON c.division = s.division AND c.classes_name = s.classes
    //     INNER JOIN
    //       tblconsulting d ON d.id_number = s.id_number
    //     INNER JOIN
    //       tblstaff stf ON stf.name = c.HCR
    //     WHERE
    //       s.id_number = ?
    //   `;
    
    //   con.query(sql, [idNumber], (err, result) => {
    //     if (err) {
    //       console.error('Error executing SQL query:', err);
    //       return res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
    //     }
    
    //     if (result.length === 0) {
    //       console.log(`No records found for id_number: ${idNumber}`);
    //       return res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
    //     }
    
    //     // Organizing data into separate arrays
    //     const firstArray = [];
    //     const secondArray = [];
    //     const thirdArray = [];
    
    //     const ids = new Set();
    //     result.forEach(item => {
    //       if (!ids.has(item.id_number)) {
    //         firstArray.push({
    //           name: item.name,
    //           profile: item.profile,
    //           id_number: item.id_number
    //         });
    //         secondArray.push({
    //           name: item.name,
    //           sick_type: item.sick_type,
    //           department: item.hcr_name,
    //           age: item.age,
    //           gender: item.gender,
    //           blood_group: item.blood_group,
    //           class_and_division: item.class_and_division,
    //           address: item.address,
    //           mobile_number: item.mobile_number,
    //           parent_name: item.parent_name,
    //           allergies_define: item.allergies_define,
    //           any_disease_define: item.any_disease_define
    //         });
    //         ids.add(item.id_number);
    //       }
    
    //       thirdArray.push({
    //         name: item.name,
    //         sick_type: item.sick_type,
    //         consult_id: item.consult_id,
    //         class_and_division: item.class_and_division,
    //         id_number: item.id_number,
    //         assignee: item.assignee,
    //         hcr_name: item.hcr_name,
    //         time: item.time,
    //         date_time: item.formatted_date_time
    //       });
    //     });
    
    //     res.status(200).json({
    //       Result: "Success",
    //       message: "Data Fetched Successfully",
    //       firstArray,
    //       secondArray,
    //       thirdArray
    //     });
    //   });
    // });
    
    app.get('/consulting_studentprofile_by_id', (req, res) => {
      const {idNumber} = req.query;
    
      // Get a connection from the pool
      con.connect(function(err) {
        if (err) {
          console.error('Error connecting to database:', err);
          res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
          return;
        }
        console.log("Connected!");
        // Use placeholders in the SQL query to prevent SQL injection
        const sql = 
          `SELECT 
  s.name,
  s.profile,
  s.id_number,
  s.department,
  DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(),s.dob)), '%Y') + 0 AS age,
  s.gender,
  s.blood_group,
  s.address,
  s.allergies_define,
  s.any_disease_define,
  s.current_health_report,
  s.past_health_report,
  d.sick_type,
  d.consult_id,
  CONCAT(s.classes, '/', s.division) AS class_and_division,
  d.id_number,
  d.assignee,
  d.hcr_name,
  CONCAT(d.from_time, ' - ', d.to_time) AS time,
  DATE_FORMAT(d.date, '%b %e, %Y') AS formatted_date_time,
  COALESCE(pf.parent_name, pm.parent_name) AS parent_name,
  COALESCE(pf.relation, pm.relation) AS relation,
  COALESCE(pf.mobile_number, pm.mobile_number) AS mobile_number,
  c.HCR as hcr_name 
FROM 
  tblstudent s
LEFT JOIN 
  tblconsulting d ON d.id_number = s.id_number
LEFT JOIN 
  tblparent pf ON pf.id_number = s.id_number AND pf.relation = 'father'
LEFT JOIN 
  tblparent pm ON pm.id_number = s.id_number AND pm.relation = 'mother'
LEFT JOIN
  tblclasses c ON c.id_number = s.id_number   
WHERE 
  s.id_number = ?`;
        
    
        // Use parameterized query to avoid SQL injection
        con.query(sql, [idNumber], function (err, result) {
          if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
            return;
          }
          if (result.length > 0) {
            console.log(`${result.length} records fetched`);
    
            // Organizing data into separate arrays
            const firstArray = [];
            const secondArray = [];
            let j = 0;
            for (let i = 0; i < result.length; i++) {
              const item = result[i];
              j = i + 1;
    
              if(result.length == 1) {
                // Push data to firstArray
                firstArray.push({
                  name: item.name,
                  profile: item.profile,
                  id_number: item.id_number
                });
                continue;
              }
              if(result.length > 1 && j < result.length) {
                console.log(result[i].id_number,'    ',result[j].id_number);
                if (i == 0) {
                  firstArray.push({
                    name: item.name,
                    profile: item.profile,
                    id_number: item.id_number
                  });
                  continue;
                } else {
                  if (result[i].id_number != result[j].id_number) {
                    firstArray.push({
                      name: item.name,
                      profile: item.profile,
                      id_number: item.id_number
                    });
                  }
                }
              }
            }
    
            // Push data to secondArray
            let k = 0;
            for (let m = 0; m < result.length; m++) {
              const item = result[m];
              k = m + 1;
    
              if(result.length == 1) {
                // Push data to firstArray
                secondArray.push({
                  name: item.name,
                  sick_type: item.sick_type,
                  department: item.hcr_name,
                  age: item.age,
                  gender: item.gender,
                  blood_group: item.blood_group,
                  class_and_division: item.class_and_division,
                  address: item.address,
                  mobile_number: item.mobile_number,
                  parent_name: item.parent_name,
                  allergies_define: item.allergies_define,
                  any_disease_define: item.any_disease_define,
                  current_health_report: item.current_health_report,
                  past_health_report: item.past_health_report
                });
                continue;
              }
              if(result.length > 1 && k < result.length) {
                console.log(result[m].id_number,'    ',result[k].id_number);
                if (m == 0) {
                  secondArray.push({
                    name: item.name,
                    sick_type: item.sick_type,
                    department: item.hcr_name,
                    age: item.age,
                    gender: item.gender,
                    blood_group: item.blood_group,
                    class_and_division: item.class_and_division,
                    address: item.address,
                    mobile_number: item.mobile_number,
                    parent_name: item.parent_name,
                    allergies_define: item.allergies_define,
                    any_disease_define: item.any_disease_define,
                    current_health_report: item.current_health_report,
                    past_health_report: item.past_health_report
                  });
                  continue;
                } else {
                  if (result[m].id_number != result[k].id_number) {
                    secondArray.push({
                      name: item.name,
                      sick_type: item.sick_type,
                      department: item.hcr_name,
                      age: item.age,
                      gender: item.gender,
                      blood_group: item.blood_group,
                      class_and_division: item.class_and_division,
                      address: item.address,
                      mobile_number: item.mobile_number,
                      parent_name: item.parent_name,
                      allergies_define: item.allergies_define,
                      any_disease_define: item.any_disease_define,
                      current_health_report: item.current_health_report,
                      past_health_report: item.past_health_report
                    });
                  }
                }
              }
            }
    
            // Organizing data into thirdArray (outside the loop)
            const thirdArray = result.map(item => ({
              name: item.name,
              sick_type: item.sick_type,
              consult_id: item.consult_id,
              class_and_division: item.class_and_division,
              id_number: item.id_number,
              assignee: item.assignee,
              hcr_name: item.HCR,
              time: item.time,
              date_time: item.formatted_date_time
            }));
    
            res.status(200).json({ Result: "Success", message: "Data Fetched Successfully",
              firstArray, secondArray, thirdArray });
          } else {
            res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
          }
        });
      });
    });


    app.get('/department_dropdown', (req, res) => {
        try {
            // Extract organization_name from query parameters
            const {organization_name} = req.query;
    
            // Build SQL query to select distinct departments for a specific organization
            let getAllDepartments;
            if (organization_name) {
                getAllDepartments = `
                    SELECT  d.department, u.organization_name
                    FROM tbldepartment d
                    INNER JOIN tbluser u ON d.organization_name = u.organization_name
                    WHERE u.organization_name = ?
                `;
            } 
    
            // Query the database with organizationName as a parameter if provided
            con.query(getAllDepartments, [organization_name], (err, result) => {
                if (err) {
                    console.error('Error querying database:', err);
                    return res.status(500).json({ Result: "Failure", message: "Internal server error" });
                }
    
                // Extract department names from the query result
                const allDepartments = result.map(record => record.department);
    
                // Send the department names as a JSON response
                res.status(200).json({
                    Result: "Success",
                    message: "All departments retrieved successfully",
                    data: allDepartments
                });
            });
        } catch (ex) {
            console.error('Error:', ex);
            res.status(500).json({ Result: "Failure", message: ex.message });
        }
    });
    

    app.get('/designation_dropdown', (req, res) => {
        try {
            // Extract organization_name from query parameters
            const {organization_name} = req.query;
    
            // Build SQL query to select distinct designation roles for a specific organization
            let getAllDesignations;
            if (organization_name) {
                getAllDesignations = `
                    SELECT  d.designation_role, u.organization_name
                    FROM tbldesignation d
                    INNER JOIN tbluser u ON d.organization_name = u.organization_name
                    WHERE u.organization_name = ?
                `;
            } 
    
            // Query the database with organizationName as a parameter if provided
            con.query(getAllDesignations, [organization_name], (err, result) => {
                if (err) {
                    console.error('Error querying database:', err);
                    return res.status(500).json({ Result: "Failure", message: "Internal server error" });
                }
    
                // Extract designation roles from the query result
                const allDesignations = result.map(record => record.designation_role);
    
                // Send the designation roles as a JSON response
                res.status(200).json({
                    Result: "Success",
                    message: "All designations retrieved successfully",
                    data: allDesignations
                });
            });
        } catch (ex) {
            console.error('Error:', ex);
            res.status(500).json({ Result: "Failure", message: ex.message });
        }
    });
    

      app.post('/access_login', (req, res) => {
        res.header('Content-Type', 'application/json');
        try {
            const { username, id_number, password } = req.body;
            console.log("username: " , username, "id_number:", id_number, "password:", password)
            // Get a connection from the pool
            con.connect(function (err) {
                if (err) throw err;
                console.log("Connected!");
                // Query to check in tbluser and tblstaff
                var sql = `SELECT id, organization_name, NULL AS department, NULL AS designation, password FROM tbluser WHERE username = ? 
                            UNION 
                            SELECT id_number, organization_name, department, designation, password FROM tblstaff WHERE id_number = ?`;
                con.query(sql, [username, id_number], function (err, result) {
                    if (err) {
                        console.error('Error:', err);
                        return res.status(500).json({ Result: "Failure", message: "Internal Server Error" });
                    }
                    if (result.length > 0) {
                        const user = result[0];
                        console.log(user.password);
                        // Verify password
                        if (user.password === password) {
                            console.log("Login successful");
                            const token = jwt.sign({ userid: user.id_number ||  user.id, organization_name: user.organization_name, department:user.department,designation:user.designation }, '605001', { expiresIn: '1h' });
                            // Include user ID in the response
                            res.status(200).json({ userid: user.id || user.id_number, organization_name: user.organization_name, department:user.department, designation:user.designation, Token: token, Result: "Success", message: "Login successful" });
                        } else {
                            console.log("Login failed: Incorrect password");
                            res.status(401).json({ Result: "Failure", message: "Login failed: Incorrect password" });
                        }
                    } else {
                        console.log("Login failed: User not found");
                        res.status(401).json({ Result: "Failure", message: "Login failed: User not found" });
                    }
                });
            });
        } catch (err) {
            console.error('Error:', err);
            res.status(500).json({ Result: "Failure", message: err.message });
        }
      });
      
      
      // Add Department
      app.post('/add_departments_accesslevel', (req, res) => {
        const { departments } = req.body;  
      
        // Check if departments array is missing or malformed
        if (!departments || !Array.isArray(departments)) {
          return res.status(400).json({ error: 'Invalid input. Departments array is missing or malformed.' });
        }
      
        // Iterate over each department and insert into the database
        departments.forEach((departmentItem) => {
          const { designation_id, access_level, department } = departmentItem;
      
          // Insert department into tbl_department table
          const insertQuery = 'INSERT INTO tblaccess_level_department (designation_id, access_level, department) VALUES (?, ?, ?)';
          con.query(insertQuery, [designation_id, access_level, department], (err, result) => {
            if (err) {
              console.error('Error inserting department:', err);
              return res.status(500).json({ error: 'Failed to insert department into database.' });
            }
          });
        });
      
        res.status(200).json({ message: 'Departments added successfully.' });
      });
      
      // Add Division
      app.post('/add_divisions_accesslevel', (req, res) => {
        const { divisions } = req.body;  
      
        // Check if divisions array is missing or malformed
        if (!divisions || !Array.isArray(divisions)) {
          return res.status(400).json({ error: 'Invalid input. Divisions array is missing.' });
        }
      
        // Iterate over each division and insert into the database
        divisions.forEach((divisionItem) => {
          const { designation_id, access_level, division} = divisionItem;
      
          // Insert division into tbl_division table
          const insertQuery = 'INSERT INTO tblaccess_level_division (designation_id, access_level, division) VALUES ( ?, ?, ?)';
          con.query(insertQuery, [ designation_id, access_level, division], (err, result) => {
            if (err) {
              console.error('Error inserting division:', err);
              return res.status(500).json({ error: 'Failed to insert division into database.' });
            }
          });
        });
      
        res.status(200).json({ message: 'Divisions added successfully.' });
      });
      
      // Add classes
      app.post('/add_classes_accesslevel', (req, res) => {
        const { classes } = req.body;  
      
        // Check if classes array is missing or malformed
        if (!classes || !Array.isArray(classes)) {
          return res.status(400).json({ error: 'Invalid input. Classes array is missing.' });
        }
      
        // Iterate over each class and insert into the database
        classes.forEach((classItem) => {
          const {designation_id, access_level, classes } = classItem;
      
          // Insert class into tbl_class table
          const insertQuery = 'INSERT INTO tblaccess_level_class (designation_id, access_level, classes) VALUES (?, ?, ?)';
          con.query(insertQuery, [designation_id, access_level, classes], (err, result) => {
            if (err) {
              console.error('Error inserting class:', err);
              return res.status(500).json({ error: 'Failed to insert class into database.' });
            }
          });
        });
      
        res.status(200).json({ message: 'Classes added successfully.' });
      });
      
      
      
      // Route for retrieving data from all three tables
      app.get('/access_levels', (req, res) => {
        const departmentsQuery = 'SELECT id, department FROM tblaccess_level_department';
        const divisionsQuery = 'SELECT id, division FROM tblaccess_level_division';
        const classesQuery = 'SELECT id, classes FROM tblaccess_level_classes';
      
        con.query(departmentsQuery, (err, departmentRows) => {
          if (err) {
            console.error('Error executing MySQL query for departments: ', err);
            res.status(500).send('Error retrieving data');
            return;
          }
      
          con.query(divisionsQuery, (err, divisionRows) => {
            if (err) {
              console.error('Error executing MySQL query for divisions: ', err);
              res.status(500).send('Error retrieving data');
              return;
            }
      
            con.query(classesQuery, (err, classRows) => {
              if (err) {
                console.error('Error executing MySQL query for classes: ', err);
                res.status(500).send('Error retrieving data');
                return;
              }
      
              const departments = departmentRows;
              const divisions = divisionRows;
              const classes = classRows;
      
              res.json({ departments, divisions, classes });
            });
          });
        });
      });
      
      
      //View Access Level Student 
      app.get('/studentviewall_access_details', (req, res) => {
        const { id_number, organization_name } = req.query;
      
        const sql = `
        SELECT d.id, da.access_level, st.name, st.profile, 
        CONCAT(st.classes, '(', st.division, ')') as division, c.hcr,  
        CASE
          WHEN father.mobile_number IS NOT NULL THEN father.mobile_number
          WHEN mother.mobile_number IS NOT NULL THEN mother.mobile_number
          ELSE NULL
        END AS parent_mobile_number, 
        DATE_FORMAT(st.dou, '%Y-%m-%d') AS last_update
        FROM tbldesignation d
        INNER JOIN tblstaff s ON s.designation = d.designation_role AND s.department = d.department AND s.organization_name = d.organization_name
        INNER JOIN tblaccess_level_department da ON da.designation_id = d.id 
        INNER JOIN tblaccess_level_division dd ON dd.designation_id = d.id 
        INNER JOIN tblaccess_level_classes dc ON dc.designation_id = d.id
        INNER JOIN tblstudent st ON st.classes = dc.classes AND st.division = dd.division 
        INNER JOIN tblclasses c ON c.classes_name = st.classes AND c.division = st.division AND c.department = s.department 
        LEFT JOIN tblparent father ON st.id_number = father.id_number AND father.relation = 'father'
        LEFT JOIN tblparent mother ON st.id_number = mother.id_number AND mother.relation = 'mother'
        WHERE s.id_number = ? AND s.organization_name = ?`;
      
        con.query(sql, [id_number, organization_name], (err, result) => {
          if (err) {
            console.error('Error fetching student access details:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
      
          res.status(200).json(result);
        });
      });
      
      
      
      //View Access Level Staff
      app.get('/staffviewall_access_details', (req, res) => {
        const {designation_role, department } = req.query;
      
        const sql = `
        SELECT DISTINCT d.id, s.name, s.profile, s.mobile_number, s.designation,
          CONCAT(s.classes, '(', s.division, ')') AS division,   
          DATE_FORMAT(s.dou, '%Y-%m-%d') AS last_update
      FROM 
          tbldesignation d
          INNER JOIN tblstaff s ON s.department = d.department
          INNER JOIN tblaccess_level_classes dc ON dc.designation_id = d.id AND dc.classes = s.classes
      WHERE 
          d.designation_role = ? AND d.department = ?;`;
      
        con.query(sql, [designation_role, department], (err, result) => {
          if (err) {
            console.error('Error fetching staff access details:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
      
          res.status(200).json(result);
        });
      });
      
      // Route to fetch consulting access details for a given student ID number
      app.get('/consulting_viewall_access_details', (req, res) => {
        const { id_number, organization_name } = req.query;
      
        const sql = `
        SELECT cs.classes, cs.division, cs.id_number, cs.patient_name, cs.sick_type, cs.health_problem,
        cs.assignee, cs.hcr_name, cs.from_time, cs.to_time, cs.consult_id, cs.status
      FROM tbldesignation d
      INNER JOIN tblstaff s ON s.designation = d.designation_role AND s.department = d.department AND s.organization_name = d.organization_name
      INNER JOIN tblaccess_level_department da ON da.designation_id = d.id 
      INNER JOIN tblaccess_level_division dd ON dd.designation_id = d.id 
      INNER JOIN tblaccess_level_classes dc ON dc.designation_id = d.id
      INNER JOIN tblstudent st ON st.classes = dc.classes AND st.division = dd.division
      INNER JOIN tblclasses c ON c.classes_name = st.classes AND c.division = st.division AND c.department = s.department 
      INNER JOIN tblconsulting cs ON cs.classes = st.classes AND cs.division = st.division 
      WHERE s.id_number = ? AND s.organization_name = ?`;
      
        con.query(sql, [id_number, organization_name], (err, result) => {
          if (err) {
            console.error('Error fetching staff access details:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
      
          res.status(200).json(result);
        });
      });
      
      
      // Route to fetch classes access details for a given student ID number
      app.get('/classes_viewall_access_details', (req, res) => {
        const { id_number, organization_name } = req.query;
      
        const sql = `
      SELECT c.classes_name, c.division, c.department, c.strength, c.HCR, c.updated_by
      FROM tbldesignation d
      INNER JOIN tblstaff s ON s.designation = d.designation_role AND s.department = d.department AND s.organization_name = d.organization_name
      INNER JOIN tblaccess_level_department da ON da.designation_id = d.id 
      INNER JOIN tblaccess_level_division dd ON dd.designation_id = d.id 
      INNER JOIN tblaccess_level_classes dc ON dc.designation_id = d.id
      INNER JOIN tblstudent st ON st.classes = dc.classes AND st.division = dd.division
      INNER JOIN tblclasses c ON c.classes_name = st.classes AND c.division = st.division AND c.department = s.department 
      WHERE s.id_number = ? AND s.organization_name = ?`;
      
        con.query(sql, [id_number, organization_name], (err, result) => {
          if (err) {
            console.error('Error fetching classes access details:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
      
          res.status(200).json(result);
        });
      });
      
      // Route to fetch department access details for a given student ID number
      app.get('/department_viewall_access_details', (req, res) => {
        const { id_number, organization_name } = req.query;
      
        const sql = `
        SELECT DISTINCT dp.department, DATE_FORMAT(dp.created_date, '%Y-%m-%d') AS created_date
        FROM tblstaff s
        INNER JOIN tbldesignation d ON s.designation = d.designation_role AND s.department = d.department AND s.organization_name = d.organization_name
        INNER JOIN tbldepartment dp ON dp.department = s.department
        WHERE s.id_number = ? AND s.organization_name = ?`;
      
        con.query(sql, [id_number, organization_name], (err, result) => {
          if (err) {
            console.error('Error fetching department access details:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
      
          res.status(200).json(result);
        });
      });
      
      
      // Route to fetch designation access details for a given student ID number
      app.get('/designation_viewall_access_details', (req, res) => {
        const { id_number, organization_name } = req.query;
      
        const sql = `
        SELECT DISTINCT d.department, d.designation_role
        FROM tblstaff s
        INNER JOIN tbldesignation d ON s.designation = d.designation_role AND s.department = d.department AND s.organization_name = d.organization_name
        INNER JOIN tbldepartment dp ON dp.department = s.department
        WHERE s.id_number = ? AND s.organization_name = ?`;
      
        con.query(sql, [id_number, organization_name], (err, result) => {
          if (err) {
            console.error('Error fetching designation access details:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
      
          res.status(200).json(result);
        });
      });
      
      
      //View Access Level Staff & Student Soft Delete
      app.get('/softdelete_access_details', (req, res) => {
        const { id_number, organization_name, designation_role, department } = req.query;
        console.log(id_number, organization_name, designation_role, department);
      
        const sql = `
        SELECT 
          d.id AS identifier,
          da.access_level,
          st.name,
          st.profile,
          CONCAT(st.classes, '(', st.division, ')') AS division,
          c.hcr,
          CASE
              WHEN father.mobile_number IS NOT NULL THEN father.mobile_number
              WHEN mother.mobile_number IS NOT NULL THEN mother.mobile_number
              ELSE NULL
          END AS parent_mobile_number,
          DATE_FORMAT(st.dou, '%Y-%m-%d') AS last_update
        FROM 
          tbldesignation d
          INNER JOIN tblstaff s ON s.designation = d.designation_role AND s.department = d.department AND s.organization_name = d.organization_name
          INNER JOIN tblaccess_level_department da ON da.designation_id = d.id 
          INNER JOIN tblaccess_level_division dd ON dd.designation_id = d.id 
          INNER JOIN tblaccess_level_classes dc ON dc.designation_id = d.id
          INNER JOIN tblstudent st ON st.classes = dc.classes AND st.division = dd.division 
          INNER JOIN tblclasses c ON c.classes_name = st.classes AND c.division = st.division AND c.department = s.department 
          LEFT JOIN tblparent father ON st.id_number = father.id_number AND father.relation = 'father'
          LEFT JOIN tblparent mother ON st.id_number = mother.id_number AND mother.relation = 'mother'
        WHERE 
          s.id_number = ? AND s.organization_name = ?
      
        UNION
      
        SELECT 
          d.id AS identifier,
          NULL AS access_level,
          s.name,
          s.profile,
          CONCAT(s.classes, '(', s.division, ')') AS division,
          NULL AS hcr,
          s.mobile_number AS parent_mobile_number,
          DATE_FORMAT(s.dou, '%Y-%m-%d') AS last_update
        FROM 
          tbldesignation d
          INNER JOIN tblstaff s ON s.department = d.department
          INNER JOIN tblaccess_level_classes dc ON dc.designation_id = d.id AND dc.classes = s.classes
        WHERE 
          d.designation_role = ? AND d.department = ?`;
      
        con.query(sql, [id_number, organization_name, designation_role, department], (err, result) => {
          if (err) {
            console.log('Error fetching soft delete access details:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
      
          if (!result || result.length === 0) {
            return res.status(404).json({ error: 'No data found' });
          }
      
          res.status(200).json(result);
        });
      });
      
      // Update Department Access Level
      app.put('/update_department_accesslevel', (req, res) => {
        const { departments } = req.body;  
      
        // Check if departments array is missing or malformed
        if (!departments || !Array.isArray(departments)) {
          return res.status(400).json({ error: 'Invalid input. Departments array is missing or malformed.' });
        }
      
        // Iterate over each department and update access level in the database
        departments.forEach((department) => {
          const { id, access_level } = department;
      
          // Update department access level in tbl_department table
          const updateQuery = 'UPDATE tblaccess_level_department SET access_level = ? WHERE id = ?';
          con.query(updateQuery, [access_level, id], (err, result) => {
            if (err) {
              console.error('Error updating department access level:', err);
              return res.status(500).json({ error: 'Failed to update department access level in database.' });
            }
          });
        });
      
        res.status(200).json({ message: 'Department access levels updated successfully.' });
      });
      
      
      
      // Update Division
      app.put('/update_divisions_accesslevel', (req, res) => {
        const { divisions } = req.body;  
      
        // Check if divisions array is missing or malformed
        if (!divisions || !Array.isArray(divisions)) {
          return res.status(400).json({ error: 'Invalid input. Divisions array is missing.' });
        }
      
        // Iterate over each division and update in the database
        divisions.forEach((division) => {
          const { id, access_level} = division;
      
          // Update division in tbl_division table
          const updateQuery = 'UPDATE tblaccess_level_division SET access_level = ? WHERE id = ?';
          con.query(updateQuery, [ access_level, id], (err, result) => {
            if (err) {
              console.error('Error updating division:', err);
              return res.status(500).json({ error: 'Failed to update division in database.' });
            }
          });
        });
      
        res.status(200).json({ message: 'Divisions updated successfully.' });
      });
      
      // Update classes
      app.put('/update_classes_accesslevel', (req, res) => {
        const { classes } = req.body;  
      
        // Check if classes array is missing or malformed
        if (!classes || !Array.isArray(classes)) {
          return res.status(400).json({ error: 'Invalid input. Classes array is missing.' });
        }
      
        // Iterate over each class and update in the database
        classes.forEach((classItem) => {
          const { id, access_level} = classItem;
      
          // Update class in tbl_class table
          const updateQuery = 'UPDATE tblaccess_level_classes SET access_level = ? WHERE id = ?';
          con.query(updateQuery, [access_level, id], (err, result) => {
            if (err) {
              console.error('Error updating class:', err);
              return res.status(500).json({ error: 'Failed to update class in database.' });
            }
          });
        });
      
        res.status(200).json({ message: 'Classes updated successfully.' });
      });
      
      
      
      // Route to fetch completed consulting access details for a given student ID number
      app.get('/done_consulting_viewall_access_details', (req, res) => {
        const { id_number, organization_name } = req.query;
      
        const sql = `
      SELECT distinct cs.classes, cs.division, cs.id_number, cs.patient_name, cs.sick_type, cs.health_problem,
      cs.assignee, cs.hcr_name, cs.from_time, cs.to_time, cs.consult_id
      FROM tbldesignation d
      INNER JOIN tblstaff s ON s.designation = d.designation_role AND s.department = d.department AND s.organization_name = d.organization_name
      INNER JOIN tblaccess_level_department da ON da.designation_id = d.id 
      INNER JOIN tblaccess_level_division dd ON dd.designation_id = d.id 
      INNER JOIN tblaccess_level_classes dc ON dc.designation_id = d.id
      INNER JOIN tblstudent st ON st.classes = dc.classes AND st.division = dd.division
      INNER JOIN tblclasses c ON c.classes_name = st.classes AND c.division = st.division AND c.department = s.department 
      INNER JOIN tblconsulting cs ON cs.classes = st.classes AND cs.division = st.division 
      WHERE s.id_number = ? AND s.organization_name = ? AND cs.status = 'completed'`;
      
        con.query(sql, [id_number, organization_name], (err, result) => {
          if (err) {
            console.error('Error fetching staff access details:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
      
          res.status(200).json(result);
        });
      });
      
      
      // Route to fetch cancelled consulting access details for a given student ID number
      app.get('/register_consulting_viewall_access_details', (req, res) => {
        const { id_number, organization_name } = req.query;
      
        const sql = `
      SELECT distinct cs.classes, cs.division, cs.id_number, cs.patient_name, cs.sick_type, cs.health_problem,
      cs.assignee, cs.hcr_name, cs.from_time, cs.to_time, cs.consult_id
      FROM tbldesignation d
      INNER JOIN tblstaff s ON s.designation = d.designation_role AND s.department = d.department AND s.organization_name = d.organization_name
      INNER JOIN tblaccess_level_department da ON da.designation_id = d.id 
      INNER JOIN tblaccess_level_division dd ON dd.designation_id = d.id 
      INNER JOIN tblaccess_level_classes dc ON dc.designation_id = d.id
      INNER JOIN tblstudent st ON st.classes = dc.classes AND st.division = dd.division
      INNER JOIN tblclasses c ON c.classes_name = st.classes AND c.division = st.division AND c.department = s.department 
      INNER JOIN tblconsulting cs ON cs.classes = st.classes AND cs.division = st.division 
      WHERE s.id_number = ? AND s.organization_name = ? AND cs.status = 'cancelled'`;
      
        con.query(sql, [id_number, organization_name], (err, result) => {
          if (err) {
            console.error('Error fetching staff access details:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
      
          res.status(200).json(result);
        });
      });




      // Route to check if id_number exists
app.post('/staff_id_number_check', (req, res) => {
    const { id_number } = req.body;
  
  
    con.query('SELECT * FROM tblstaff WHERE id_number = ?', [id_number], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (results.length > 0) {
  
        return res.status(200).json({ message: 'ID number exists' });
      } else {
  
        return res.status(200).json({ message: 'ID number does not exist' });
      }
    });
  });
  
  
  
  
  // Route to check if id_number exists
  app.post('/student_id_number_check', (req, res) => {
    const { id_number } = req.body;
  
  
    con.query('SELECT * FROM tblstudent WHERE id_number = ?', [id_number], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (results.length > 0) {
  
        return res.status(200).json({ message: 'ID number exists' });
      } else {
  
        return res.status(200).json({ message: 'ID number does not exist' });
      }
    });
  });
  

  app.post('/forgot_password', async(req, res) => {
    const { name, email, message } = req.body;
  
    // Replace these with your actual email and SMTP server details
    var transporter = nodemailer.createTransport( {
      host: "smtp-mail.outlook.com", // hostname
      secureConnection: false, // TLS requires secureConnection to be false
      port: 587, // port for secure SMTP
      auth: {
          user: "elanchezhian789@outlook.com",
          pass: "90038elan"
      },
      tls: {
          ciphers:'SSLv3'
      }
  });
    const mailOptions = {
        from: 'elanchezhian789@outlook.com',
       // to: 'rockerelan@gmail.com',
        to: email,
        subject: 'Medshyne Contact Us',
        message: message,
        text: `Name: ${name}\nEmail: ${email}\nOTP: ${message}`
    };
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
      res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
  });




  const accountSid = 'ACa2dfad5fe250cd0a61df89f5ac971927';
const authToken = '07f09f8f37010465ced0b40977da1e45';
const twilioPhoneNumber = '+12512990421';
const client = twilio(accountSid, authToken);

// app.use(bodyParser.json());
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
// Send OTP via SMS
function sendOTP(organization_mobile_no, otp) {
  return client.messages.create({
    body: `Your OTP for login is: ${otp}`,
    from: twilioPhoneNumber,
    to: organization_mobile_no
  });
}

const checkMobileNumberExists = (organization_mobile_no) => {     
    con.connect(function(err) {
      if (err) throw err;
      console.log("Connected!");
      console.log('organization mobile :', organization_mobile_no);
      var sql = 'SELECT * FROM tbluser WHERE `organization_mobile_no` = ?';
      con.query(sql, [organization_mobile_no], function (err, result) {
        if (err) {
          console.error('Error checking user credentials:', err);
          console.log(result);         
      }
      console.log('database result',result.length);
      return result.length;
});
});
}


// Update OTP in the database
const updateOTPInDatabase = async (organization_mobile_no, otp) => {
   con.query('UPDATE tbluser SET otp = ? WHERE organization_mobile_no = ?', [otp, organization_mobile_no]);
};

// User login request
app.post('/login_otp',  (req, res) => {
  const { organization_mobile_no } = req.body;

  try {
    const mobileExists =  checkMobileNumberExists(organization_mobile_no);
    console.log('mobile exsists',mobileExists);
    if (mobileExists==0) {
      return res.status(404).json({ success: false, message: 'Mobile number not found' });
    }
    // Generate OTP
    const otp = generateOTP();
    // Send OTP
    sendOTP(organization_mobile_no, otp)
      .then(() => {
        console.log(`OTP sent to ${organization_mobile_no}: ${otp}`);
        // Update OTP in the database
        updateOTPInDatabase(organization_mobile_no, otp)
          .then(() => {
            console.log('OTP updated in the database');
            req.session.mobileNumber = organization_mobile_no;
            res.json({ success: true, message: 'OTP sent successfully' });
          })
          .catch(error => {
            console.error('Error updating OTP in the database:', error);
            res.status(500).json({ success: false, error: 'Failed to update OTP in the database' });
          });
      })
      .catch(error => {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, error: 'Failed to send OTP' });
      });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ success: false, error: 'Failed to log in' });
  }
});

// Verify OTP and login
app.post('/verify_otp', async (req, res) => {
  const { otp } = req.body;
  
  const organization_mobile_no = req.session.mobileNumber;
  try {    
    const rows =  con.query('SELECT otp FROM tbluser WHERE organization_mobile_no = ?', [organization_mobile_no]);
    const savedOTP = rows.otp;
    if (otp === savedOTP) {
      // OTP verification successful
     res.json({ success: true, message: 'Login successful', organization_mobile_no });
    } else {
      res.status(401).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
});

// Organization Onboarding Backend End By Patchaiyappan



// Organization Onboarding Backend Start By Velmurugan Those API's No Integrate 

app.post('/login', (req, res) => {
  res.header('Content-Type', 'application/json');
  try {
      const { username, id_number, password } = req.body;
      console.log("username: " , username, "id_number:", id_number, "password:", password)
      // Get a connection from the pool
      con.connect(function (err) {
          if (err) throw err;
          console.log("Connected!");
          // Query to check in tbluser and tblstaff
          var sql = `SELECT id, organization_name, NULL AS department, NULL AS designation, password FROM tbluser WHERE username = ? 
                      UNION 
                      SELECT id_number, organization_name, department, designation, password FROM tblstaff WHERE id_number = ?`;
          con.query(sql, [username, id_number], function (err, result) {
              if (err) {
                  console.error('Error:', err);
                  return res.status(500).json({ Result: "Failure", message: "Internal Server Error" });
              }
              if (result.length > 0) {
                  const user = result[0];
                  console.log(user.password);
                  // Verify password
                  if (user.password === password) {
                      console.log("Login successful");
                      const token = jwt.sign({ userid: user.id_number ||  user.id, organization_name: user.organization_name, department:user.department,designation:user.designation }, '605001', { expiresIn: '1h' });
                      // Include user ID in the response
                      res.status(200).json({ userid: user.id || user.id_number, organization_name: user.organization_name, department:user.department, designation:user.designation, Token: token, Result: "Success", message: "Login successful" });
                  } else {
                      console.log("Login failed: Incorrect password");
                      res.status(401).json({ Result: "Failure", message: "Login failed: Incorrect password" });
                  }
              } else {
                  console.log("Login failed: User not found");
                  res.status(401).json({ Result: "Failure", message: "Login failed: User not found" });
              }
          });
      });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ Result: "Failure", message: err.message });
  }
});


app.put('/update_status_completed', (req, res) => {
  res.header('Content-Type', 'application/json');
  try{
    const {consult_id, to_time} = req.body;  
    var sql = `update tblconsulting set status = "completed", to_time = ? where consult_id = ?`;
    con.query(sql, [consult_id, to_time], function (err, result) {
      if (err) throw err;
      console.log("record updated :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
    });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ Result: "Failure", message: e.message });
  }
});


app.put('/Is_delete_appointment', (req,res) => {
  res.header('Content-Type', 'application/json');
  try{
    const {consult_id} = req.query;  
    var sql = `update tblconsulting set is_deleted="1" where consult_id =?`;
    con.query(sql, [consult_id], function (err, result) {
      if (err) throw err;
      console.log("record deleted :" + JSON.stringify(result));
      res.status(200).json({ Result: "Success", message: "Data Deleted Successfully", result });
    });
  } catch (e) {
    console.error('Error:', e);
    res.status(500).json({ Result: "Failure", message: e.message });
  }  
});


app.get('/hcrname_dropdown', (req, res) => {
    try {
        // Extract organization_name from query parameters
        const {organization_name} = req.query;

        // Build SQL query to select HCR names for a specific organization where hcr = 1
        let getAllHcrNames;
        if (organization_name) {
            getAllHcrNames = `
                SELECT s.name, u.organization_name
                FROM tblstaff s
                INNER JOIN tbluser u ON s.organization_name = u.organization_name
                WHERE s.hcr = 1 AND u.organization_name = ?
            `;
        }

        // Query the database with organizationName as a parameter if provided
        con.query(getAllHcrNames, [organization_name], (err, result) => {
            if (err) {
                console.error('Error querying database:', err);
                return res.status(500).json({ Result: "Failure", message: "Internal server error" });
            }

            // Extract HCR names from the query result
            const hcrNames = result.map(record => record.name);

            // Send the HCR names as a JSON response
            res.status(200).json({
                Result: "Success",
                message: "All HCR names retrieved successfully",
                data: hcrNames
            });
        });
    } catch (ex) {
        console.error('Error:', ex);
        res.status(500).json({ Result: "Failure", message: ex.message });
    }
});



app.put('/update_Strength', (req, res) => {
  // SQL query to update the strength in the classes table
  const sql = `
    UPDATE tblclasses AS c
    JOIN (
      SELECT classes, division, COUNT(*) AS strength 
      FROM tblstudent 
      GROUP BY classes, division
    ) AS s ON c.classes_name = s.classes AND c.division = s.division
    SET c.strength = s.strength `;

  // Execute the SQL query
  con.query(sql, (err, result) => {
    if (err) {
      console.error('Error updating strength:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    console.log('Strength updated successfully');
    res.status(200).json({ message: 'Strength updated successfully', result });
  });
});

// Organization Onboarding Backend End By Velmurugan Those API's No Integrate 

// Organization Onboarding Backend Start By Elanchezhian Those API's No Integrate

app.post('/logout', (req, res) => {
    
  res.clearCookie('jwt_token'); 

  res.status(200).json({
    Result: "Success",
    message: "Logout Successful"
  });
});


app.get('/get_all_student_list', (req, res) => { 
  res.header('Content-Type', 'application/json'); 
 
  try { 
      con.connect(function(err) { 
          if (err) throw err; 
          console.log("Connected!"); 
 
          const query = ` 
              SELECT  
              c.hcr_name, 
              s.updated_at, 
              s.division, 
              s.profile, 
              s.name, 
              hp.mobile_number 
              FROM  
                  tblclasses c 
              LEFT JOIN  
                  tblstudent s ON c.division = s.division 
              LEFT JOIN  
                  tblparent hp ON s.id_number = hp.id_number 
          `; 
 
          con.query(query, function (err, result) { 
              if (err) { 
                  console.error('Error executing SQL query:', err); 
                  res.status(500).json({ Result: "Failure", message: "Failed to fetch data" }); 
              } else { 
                  console.log(`${result.length} records fetched`); 
                  res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", 
data: result }); 
              } 
          }); 
      }); 
  } catch (err) { 
      console.error('Error:', err); 
      res.status(500).json({ Result: "Failure", message: err.message }); 
  } 
}); 


// Recovery View by ID
app.get('/viewbyid_recovery', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { id_number } = req.query;

    // Check if id_number is provided
    if (!id_number) {
      return res.status(400).json({
        result: "failure",
        message: "Please provide a valid id_number"
      });
    }

    // Query for student recovery
    const StudentRecoveryQuery = `
      SELECT s.profile, s.current_health_report, s.past_health_report, s.name AS student_name, s.id_number,
            s.address, s.allergies_define, s.any_disease_define, s.classes, s.division,
            s.blood_group, s.gender, s.dob, s.allergies, s.any_disease, s.updated_at,
            father.parent_name AS father_name, father.mobile_number AS father_mobile,
            mother.parent_name AS mother_name, mother.mobile_number AS mother_mobile,
            father.relation AS father_relation, mother.relation AS mother_relation
          FROM 
            tblstudent s
            LEFT JOIN tblparent father ON s.id_number = father.id_number AND father.relation = 'father' 
            LEFT JOIN tblparent mother ON s.id_number = mother.id_number AND mother.relation = 'mother'
          WHERE s.id_number = ?
    `;

    con.query(StudentRecoveryQuery, [id_number], function (err, result) {
      if (err) {
        console.error('Database Error:', err);
        return res.status(500).json({
          result: "failure",
          message: "Internal Server Error"
        });
      }

      if (result.length > 0) {
        console.log("Retrieved Student Recovery for student with ID:", id_number);
        res.status(200).json({
          result: "success",
          message: "Student Recovery Retrieved Successfully",
          data: result[0]  
        });
      } else {
        // Query for staff recovery if student is not found
        const StaffRecoveryQuery = `
          SELECT id, designation, department, updated_at, profile, current_health_report,
                 past_health_report, name, id_number, address, allergies_define, any_disease_define,
                 classes, division, blood_group, gender, dob, mobile_number, allergies, any_disease, hcr
            FROM tblstaff
           WHERE id_number = ?
        `;

        con.query(StaffRecoveryQuery, [id_number], function (staffErr, staffResult) {
          if (staffErr) {
            console.error('Database Error:', staffErr);
            return res.status(500).json({
              result: "failure",
              message: "Internal Server Error"
            });
          }

          if (staffResult.length > 0) {
            console.log("Retrieved Staff Recovery for staff with ID:", id_number);
            res.status(200).json({
              result: "success",
              message: "Staff Recovery Retrieved Successfully",
              data: staffResult[0]  
            });
          } else {
            res.status(404).json({
              result: "failure",
              message: "Student or Staff not found"
            });
          }
        });
      }
    });
  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({
      result: "failure",
      message: "Internal Server Error"
    });
  }
});

// app.post('/parentdetails', (req, res) => {
//   res.header('Content-Type', 'application/json');

//   try {
//     const {id_number, parent_name, relation, mobile_number, doc, dou, updated_by, updated_at} = req.body;


//     con.connect(function (err) {
//       if (err) {
//         console.error('Error connecting to database:', err);
//         return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
//       }

//       console.log("Connected to database!");
//       var sql = `INSERT INTO tblparent (id_number, parent_name, relation, mobile_number, doc, dou, updated_by, updated_at, is_deleted) 
//       VALUES (?, ?, ?, ?, ?, now(),?, now(), 0 )`;

//       con.query(sql, [id_number|| null, parent_name || null, relation ||  null, mobile_number || null, doc || null, dou || null, updated_by || null, updated_at || null],

//         function (err, result) {
//           if (err) {
//             console.error('Error executing SQL query:', err);
//             return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
//           }

//           console.log("1 record inserted");
//           res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
//         });
//     });

//   } catch (ex) {
//     console.error('Error:', ex);
//     res.status(500).json({ Result: "Failure", message: ex.message });
//   }
// });

app.post('/parentdetails', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const { id_number, parent_name, relation, mobile_number, doc, dou, updated_by, organization_name } = req.body;

    con.connect(function(err) {
      if (err) {
        console.error('Error connecting to database:', err);
        return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
      }

      console.log("Connected to database!");
      
      var sql = `INSERT INTO tblparent 
                 (id_number, parent_name, relation, mobile_number, doc, dou, updated_by, updated_at, organization_name) 
                 VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW(), ?)`;

      con.query(sql, [id_number || null, parent_name || null, relation || null, mobile_number || null, doc || null, dou || null, updated_by || null, organization_name || null],
        function (err, result) {
          if (err) {
            console.error('Error executing SQL query:', err);
            return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
          }

          console.log("1 record inserted");
          res.status(200).json({ Result: "Success", message: "Data Inserted Successfully", result });
        });
    });

  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});


app.put('/update_parent', (req, res) => {
  res.header('Content-Type', 'application/json');

  try {
    const {id_number, parent_name, relation, mobile_number, doc, dou, updated_by } = req.body;

    con.connect(function (err) {
      if (err) {
        console.error('Error connecting to database:', err);
        return res.status(500).json({ Result: "Failure", message: "Error connecting to database" });
      }

      console.log("Connected to database!");
      var sql = `UPDATE tblparent 
                 SET parent_name = ?, relation = ?, mobile_number = ?, doc = ?, dou = NOW(), updated_by = ?, updated_at = NOW()
                 WHERE id_number = ?`;

      con.query(sql, [parent_name || null, relation || null, mobile_number || null, doc || null, dou || null, updated_by || null, id_number],

        function (err, result) {
          if (err) {
            console.error('Error executing SQL query:', err);
            return res.status(500).json({ Result: "Failure", message: "Error executing SQL query", error: err });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ Result: "Failure", message: "Parent not found" });
          }

          console.log("1 record updated");
          res.status(200).json({ Result: "Success", message: "Data Updated Successfully", result });
        });
    });

  } catch (ex) {
    console.error('Error:', ex);
    res.status(500).json({ Result: "Failure", message: ex.message });
  }
});

// // GET Consulting Profile by ID 
// app.get('/consulting_profile_by_id', (req, res) => {
//   const { idNumber } = req.query;

//   // Get a connection from the pool
//   con.connect(function (err) {
//     if (err) {
//       console.error('Error connecting to database:', err);
//       res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
//       return;
//     }
//     console.log("Connected!");

//     const studentSql = `
//       SELECT 
//         'student' AS type,
//         s.name,
//         s.profile,
//         s.id_number,
//         s.department,
//         DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), s.dob)), '%Y') + 0 AS age,
//         s.gender,
//         s.blood_group,
//         s.address,
//         s.allergies_define,
//         s.any_disease_define,
//         s.current_health_report,
//         s.past_health_report,
//         d.sick_type,
//         d.consult_id,
//         CONCAT(s.classes, '/', s.division) AS class_and_division,
//         d.id_number,
//         d.assignee,
//         d.hcr_name,
//         CONCAT(d.from_time, ' - ', d.to_time) AS time,
//         DATE_FORMAT(d.date, '%b %e, %Y') AS formatted_date_time,
//         COALESCE(pf.parent_name, pm.parent_name) AS parent_name,
//         COALESCE(pf.relation, pm.relation) AS relation,
//         COALESCE(pf.mobile_number, pm.mobile_number) AS mobile_number,
//         c.HCR AS hcr_name 
//       FROM 
//         tblstudent s
//       LEFT JOIN 
//         tblconsulting d ON d.id_number = s.id_number
//       LEFT JOIN 
//         tblparent pf ON pf.id_number = s.id_number AND pf.relation = 'father'
//       LEFT JOIN 
//         tblparent pm ON pm.id_number = s.id_number AND pm.relation = 'mother'
//       LEFT JOIN
//         tblclasses c ON c.id_number = s.id_number   
//       WHERE 
//         s.id_number = ?`;

//     const staffSql = `
//       SELECT 
//         'staff' AS type,
//         st.designation,
//         st.name,
//         st.profile,
//         st.id_number,
//         st.department,
//         DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), st.dob)), '%Y') + 0 AS age,
//         st.gender,
//         st.blood_group,
//         st.address,
//         st.mobile_number,
//         st.allergies_define,
//         st.any_disease_define,
//         st.current_health_report,
//         st.past_health_report,
//         d.sick_type,
//         d.consult_id,
//         CONCAT(st.classes, '/', st.division) AS class_and_division,
//         d.id_number,
//         d.id_number AS hcr_id,
//         d.assignee,
//         d.hcr_name,
//         CONCAT(d.from_time, ' - ', d.to_time) AS time,
//         DATE_FORMAT(d.date, '%b %e, %Y') AS formatted_date_time
//       FROM 
//         tblstaff st
//       LEFT JOIN 
//         tblconsulting d ON st.id_number = d.id_number
//       WHERE 
//         st.id_number = ?`;

//     con.query(studentSql, [idNumber], function (err, studentResult) {
//       if (err) {
//         console.error('Error executing SQL query for student:', err);
//         res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
//         return;
//       }
      
//       if (studentResult.length > 0) {
//         processResult(studentResult, res, 'student');
//       } else {
//         con.query(staffSql, [idNumber], function (err, staffResult) {
//           if (err) {
//             console.error('Error executing SQL query for staff:', err);
//             res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
//             return;
//           }
          
//           if (staffResult.length > 0) {
//             processResult(staffResult, res, 'staff');
//           } else {
//             res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
//           }
//         });
//       }
//     });
//   });
// });

// function processResult(result, res, type) {
//   console.log(`${result.length} records fetched`);
  
//   const firstArray = [];
//   const secondArray = [];
//   const thirdArray = [];
//   const processedIdsSecond = new Set();
//   const processedIdsThird = new Set();

//   for (let i = 0; i < result.length; i++) {
//     const item = result[i];

//     if (i === 0) {
//       firstArray.push({
//         name: item.name,
//         profile: item.profile,
//         id_number: item.id_number
//       });

//       if (type === 'staff') {
//         firstArray[0].designation = item.designation;
//       }
//     }

//     // Ensure only one entry per student in the secondArray
//     if (type === 'student' && !processedIdsSecond.has(item.id_number)) {
//       secondArray.push({
//         name: item.name,
//         department: item.department,
//         age: item.age,
//         gender: item.gender,
//         blood_group: item.blood_group,
//         class_and_division: item.class_and_division,
//         address: item.address,
//         mobile_number: item.mobile_number,
//         allergies_define: item.allergies_define,
//         any_disease_define: item.any_disease_define,
//         current_health_report: item.current_health_report,
//         past_health_report: item.past_health_report
//       });
//       processedIdsSecond.add(item.id_number);
//     } else if (type === 'staff') {
//       secondArray.push({
//         name: item.name,
//         department: item.department,
//         age: item.age,
//         gender: item.gender,
//         blood_group: item.blood_group,
//         class_and_division: item.class_and_division,
//         address: item.address,
//         mobile_number: item.mobile_number,
//         allergies_define: item.allergies_define,
//         any_disease_define: item.any_disease_define,
//         current_health_report: item.current_health_report,
//         past_health_report: item.past_health_report
//       });
//     }

//     // Ensure only one entry per student in the thirdArray
//     if (type === 'student' && !processedIdsThird.has(item.id_number)) {
//       thirdArray.push({
//         name: item.name,
//         sick_type: item.sick_type,
//         consult_id: item.consult_id,
//         class_and_division: item.class_and_division,
//         id_number: item.id_number,
//         assignee: item.assignee,
//         hcr_name: item.hcr_name,
//         time: item.time,
//         date_time: item.formatted_date_time
//       });
//       processedIdsThird.add(item.id_number);
//     } else if (type === 'staff') {
//       thirdArray.push({
//         name: item.name,
//         sick_type: item.sick_type,
//         consult_id: item.consult_id,
//         class_and_division: item.class_and_division,
//         id_number: item.id_number,
//         assignee: item.assignee,
//         hcr_name: item.hcr_name,
//         time: item.time,
//         date_time: item.formatted_date_time
//       });
//     }
//   }

//   res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", firstArray, secondArray, thirdArray });
// }



app.get('/consulting_profile_by_id', (req, res) => {
  const { idNumber } = req.query;

  // Get a connection from the pool
  con.connect(function (err) {
    if (err) {
      console.error('Error connecting to database:', err);
      res.status(500).json({ Result: "Failure", message: "Failed to connect to the database" });
      return;
    }
    console.log("Connected!");

    // First, determine the role based on the idNumber
    const roleSql = `
      SELECT 'student' AS role FROM tblstudent WHERE id_number = ?
      UNION ALL
      SELECT 'staff' AS role FROM tblstaff WHERE id_number = ?
    `;

    con.query(roleSql, [idNumber, idNumber], function (err, roleResult) {
      if (err) {
        console.error('Error executing SQL query to determine role:', err);
        res.status(500).json({ Result: "Failure", message: "Failed to determine role" });
        return;
      }

      if (roleResult.length === 0) {
        res.status(404).json({ Result: "Failure", message: "No records found for the provided id_number" });
        return;
      }

      const role = roleResult[0].role;
      let dataSql;

      if (role === 'student') {
        dataSql = `
          SELECT 
            'student' AS type,
            s.name,
            s.profile,
            s.id_number,
            s.department,
            DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), s.dob)), '%Y') + 0 AS age,
            s.gender,
            s.blood_group,
            s.address,
            s.allergies_define,
            s.any_disease_define,
            s.current_health_report,
            s.past_health_report,
            d.sick_type,
            d.consult_id,
            CONCAT(s.classes, '/', s.division) AS class_and_division,
            d.id_number,
            d.assignee,
            d.hcr_name,
            CONCAT(d.from_time, ' - ', d.to_time) AS time,
            DATE_FORMAT(d.date, '%b %e, %Y') AS formatted_date_time,
            COALESCE(pf.parent_name, pm.parent_name) AS parent_name,
            COALESCE(pf.relation, pm.relation) AS relation,
            COALESCE(pf.mobile_number, pm.mobile_number) AS mobile_number,
            c.HCR AS hcr_name 
          FROM 
            tblstudent s
          LEFT JOIN 
            tblconsulting d ON d.id_number = s.id_number
          LEFT JOIN 
            tblparent pf ON pf.id_number = s.id_number AND pf.relation = 'father'
          LEFT JOIN 
            tblparent pm ON pm.id_number = s.id_number AND pm.relation = 'mother'
          LEFT JOIN
            tblclasses c ON c.id_number = s.id_number   
          WHERE 
            s.id_number = ?`;
      } else {
        dataSql = `
          SELECT 
            'staff' AS type,
            st.designation,
            st.name,
            st.profile,
            st.id_number,
            st.department,
            DATE_FORMAT(FROM_DAYS(DATEDIFF(NOW(), st.dob)), '%Y') + 0 AS age,
            st.gender,
            st.blood_group,
            st.address,
            st.mobile_number,
            st.allergies_define,
            st.any_disease_define,
            st.current_health_report,
            st.past_health_report,
            d.sick_type,
            d.consult_id,
            CONCAT(st.classes, '/', st.division) AS class_and_division,
            d.id_number,
            d.id_number AS hcr_id,
            d.assignee,
            d.hcr_name,
            CONCAT(d.from_time, ' - ', d.to_time) AS time,
            DATE_FORMAT(d.date, '%b %e, %Y') AS formatted_date_time
          FROM 
            tblstaff st
          LEFT JOIN 
            tblconsulting d ON st.id_number = d.id_number
          WHERE 
            st.id_number = ?`;
      }

      con.query(dataSql, [idNumber], function (err, result) {
        if (err) {
          console.error('Error executing SQL query for data:', err);
          res.status(500).json({ Result: "Failure", message: "Failed to fetch data" });
          return;
        }

        processResult(result, res, role);
      });
    });
  });
});

function processResult(result, res, role) {
  console.log(`${result.length} records fetched`);
  
  const firstArray = [];
  const secondArray = [];
  const thirdArray = [];
  const processedIdsSecond = new Set();
  const processedIdsThird = new Set();

  for (let i = 0; i < result.length; i++) {
    const item = result[i];

    if (i === 0) {
      firstArray.push({
        name: item.name,
        profile: item.profile,
        id_number: item.id_number,
        role: role
      });

      if (role === 'staff') {
        firstArray[0].designation = item.designation;
      }
    }

    // Ensure only one entry per student in the secondArray
    if (role === 'student' && !processedIdsSecond.has(item.id_number)) {
      secondArray.push({
        name: item.name,
        department: item.department,
        age: item.age,
        gender: item.gender,
        blood_group: item.blood_group,
        class_and_division: item.class_and_division,
        address: item.address,
        mobile_number: item.mobile_number,
        allergies_define: item.allergies_define,
        any_disease_define: item.any_disease_define,
        current_health_report: item.current_health_report,
        past_health_report: item.past_health_report,
        role: role
      });
      processedIdsSecond.add(item.id_number);
    } else if (role === 'staff') {
      secondArray.push({
        name: item.name,
        department: item.department,
        age: item.age,
        gender: item.gender,
        blood_group: item.blood_group,
        class_and_division: item.class_and_division,
        address: item.address,
        mobile_number: item.mobile_number,
        allergies_define: item.allergies_define,
        any_disease_define: item.any_disease_define,
        current_health_report: item.current_health_report,
        past_health_report: item.past_health_report,
        role: role
      });
    }

    // Ensure only one entry per student in the thirdArray
    if (role === 'student' && !processedIdsThird.has(item.id_number)) {
      thirdArray.push({
        name: item.name,
        sick_type: item.sick_type,
        consult_id: item.consult_id,
        class_and_division: item.class_and_division,
        id_number: item.id_number,
        assignee: item.assignee,
        hcr_name: item.hcr_name,
        time: item.time,
        date_time: item.formatted_date_time,
        role: role
      });
      processedIdsThird.add(item.id_number);
    } else if (role === 'staff') {
      thirdArray.push({
        name: item.name,
        sick_type: item.sick_type,
        consult_id: item.consult_id,
        class_and_division: item.class_and_division,
        id_number: item.id_number,
        assignee: item.assignee,
        hcr_name: item.hcr_name,
        time: item.time,
        date_time: item.formatted_date_time,
        role: role
      });
    }
  }

  res.status(200).json({ Result: "Success", message: "Data Fetched Successfully", firstArray, secondArray, thirdArray });
}


// Organization Onboarding Backend End By Elanchezhian Those API's No Integrate


//listing port 
var server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  
  server.timeout = 500000;