import { collegeOptions, getCoursesForCollege } from './courses';
import pronounsList from './pronouns';
import yearLevelOptions from './yearLevel';
import expectedYearOptions from './expectedyear';

export const initialFormData = {
  // Phase One
  email: "",
  // Phase Two
  lastName: "",
  firstName: "",
  middleName: "",
  birthDate: "",
  contactNumber: "",
  pronouns: "",
  password: "",
  confirmPassword: "",
  // Phase Three
  studentID: "",
  universityBranch: "SANTA MESA",
  college: "",
  course: "",
  yearLevel: "",
  // Phase Four
  username: "",
  profilePicture: null,
  bio: "", 
  // Phase Five
  cor: null,
  studentIDPictureFront: null,
  studentIDPictureBack: null,
};

export const fieldConfig = {
  // Phase One
  email: {
    label: "Email",
    required: true,
    type: 'email',
    component: 'textfield'
  },
  
  // Phase Two
  lastName: { 
    label: "Last Name",
    required: true, 
    uppercase: true,
    type: 'text',
    component: 'textfield'
  },
  firstName: { 
    label: "First Name",
    required: true, 
    uppercase: true,
    type: 'text',
    component: 'textfield'
  },
  middleName: { 
    label: "Middle Name",
    required: false, 
    uppercase: true,
    type: 'text',
    component: 'textfield'
  },
  birthDate: {
    label: "Birth Date",
    required: true,
    type: 'date',
    component: 'dateDropdown'
  },
  contactNumber: { 
    label: "Contact Number",
    required: true, 
    integerOnly: true,
    type: 'tel',
    component: 'textfield'
  },
  pronouns: {
    label: "Pronouns",
    required: true,
    type: 'select',
    component: 'dropdown',
    options: pronounsList 
  },
  password: { 
    label: "Password",
    required: true, 
    type: 'password',
    minLength: 8,
    component: 'textfield'
  },
  confirmPassword: { 
    label: "Confirm Password",
    required: true, 
    type: 'password',
    matchField: 'password',
    component: 'textfield'
  },

  // Phase Three
  studentID: { 
    label: "Student ID Number",
    required: true, 
    uppercase: true,
    type: 'text',
    component: 'textfield'
  },
  universityBranch: {
    label: "University Branch",
    required: true,
    type: 'text',
    component: 'textfield',
    disabled: true,
    defaultValue: "SANTA MESA"
  },
  college: {
    label: "College",
    required: true,
    type: 'select',
    component: 'dropdown',
    options: collegeOptions, 
    resetFields: ['course']
  },
  course: {
    label: "Course",
    required: true,
    type: 'select',
    component: 'dropdown',
    dynamicOptions: (formData) => getCoursesForCollege(formData.college)
  },
  yearLevel: {
    label: "Year Level",
    required: true,
    type: 'select',
    component: 'dropdown',
    options: yearLevelOptions
  },

  // Phase Four
  username: {
    label: "Username",
    required: true,
    type: 'text',
    component: 'textfield',
    minLength: 3,
    maxLength: 20
  },
  profilePicture: {
    label: "Profile Picture",
    required: false,
    type: 'file',
    component: 'fileUpload',
    accept: 'image/*'
  },
  bio: {
    label: "Bio",
    required: false,
    type: 'textarea',
    component: 'textarea',
    maxLength: 300,
    rows: 8
  },

  // Phase Five
  cor: {
    label: "Certificate of Registration (COR)",
    required: true,
    type: 'file',
    component: 'fileUpload',
    accept: '.pdf,.jpg,.jpeg,.png'
  },
  studentIDPictureFront: {
    label: "Student ID (Front)",
    required: true,
    type: 'file',
    component: 'fileUpload',
    accept: 'image/*'
  },
  studentIDPictureBack: {
    label: "Student ID (Back)",
    required: true,
    type: 'file',
    component: 'fileUpload',
    accept: 'image/*'
  }
};

// Phase organization
export const phaseConfig = {
  1: {
    label: "Email Verification",
    title: "Enter your active email",
    fields: ['email']
  },
  2: {
    label: "Personal Details",
    title: "",
    fields: ['lastName', 'firstName', 'middleName', 'birthDate', 'contactNumber', 'pronouns', 'password', 'confirmPassword']
  },
  3: {
    label: "Student Details", 
    title: "",
    fields: ['studentID', 'universityBranch', 'college', 'course', 'yearLevel']
  },
  4: {
    label: "Account Setup",
    title: "",
    fields: ['username', 'profilePicture', 'bio']
  },
  5: {
    label: "Student Verification",
    title: "",
    fields: ['cor', 'studentIdFront', 'studentIdBack']
  }
};

export default initialFormData;