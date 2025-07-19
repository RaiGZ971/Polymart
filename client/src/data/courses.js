const collegeCourses = {
  "College of Accountancy and Finance (CAF)": [
    "Bachelor of Science in Accountancy (BSA)",
    "Bachelor of Science in Management Accounting (BSMA)",
    "Bachelor of Science in Business Administration Major in Financial Management (BSBAFM)",
  ],
  "College of Architecture, Design and the Built Environment (CADBE, formerly the College of Architecture and Fine Arts)": [
    "Bachelor of Science in Architecture (BS-ARCH)",
    "Bachelor of Science in Interior Design (BSID)",
    "Bachelor of Science in Environmental Planning (BSEP)",
  ],
  "College of Arts and Letters (CAL)": [
    "Bachelor of Arts in English Language Studies (ABELS)",
    "Bachelor of Arts in Filipinology (ABF)",
    "Bachelor of Arts in Literary and Cultural Studies (ABLCS)",
    "Bachelor of Arts in Philosophy (AB-PHILO)",
    "Bachelor of Performing Arts major in Theater Arts (BPEA)",
  ],
  "College of Business Administration (CBA)": [
    "Doctor in Business Administration (DBA)",
    "Master in Business Administration (MBA)",
    "Bachelor of Science in Business Administration major in Human Resource Management (BSBAHRM)",
    "Bachelor of Science in Business Administration major in Marketing Management (BSBA-MM)",
    "Bachelor of Science in Entrepreneurship (BSENTREP)",
    "Bachelor of Science in Office Administration (BSOA)",
  ],
  "College of Communication (COC)": [
    "Bachelor in Advertising and Public Relations (BADPR)",
    "Bachelor of Arts in Broadcasting",
    "Bachelor of Arts in Communication Research (BACR)",
    "Bachelor of Arts in Journalism (BAJ)",
  ],
  "College of Computer and Information Sciences (CCIS)": [
    "Bachelor of Science in Computer Science (BSCS)",
    "Bachelor of Science in Information Technology (BSIT)",
  ],
  "College of Education (COED)": [
    "Doctor of Philosophy in Education Management (PhDEM)",
    "Master of Arts in Education Management (MAEM)",
    "Master in Business Education (MBE)",
    "Master in Library and Information Science (MLIS)",
    "Master of Arts in English Language Teaching (MAELT)",
    "Master of Arts in Education major in Mathematics Education (MAEd-ME)",
    "Master of Arts in Physical Education and Sports (MAPES)",
    "Master of Arts in Education major in Teaching in the Challenged Areas (MAED-TCA)",
    "Post-Baccalaureate Diploma in Education (PBDE)",
    "Bachelor of Technology and Livelihood Education (BTLEd) major in: Home Economics, Industrial Arts, ICT",
    "Bachelor of Library and Information Science (BLIS)",
    "Bachelor of Secondary Education (BSEd) major in: English, Math, Science, Filipino, Social Studies",
    "Bachelor of Elementary Education (BEEd)",
    "Bachelor of Early Childhood Education (BECEd)",
  ],
  "College of Engineering (CE)": [
    "Bachelor of Science in Civil Engineering (BSCE)",
    "Bachelor of Science in Computer Engineering (BSCpE)",
    "Bachelor of Science in Electrical Engineering (BSEE)",
    "Bachelor of Science in Electronics Engineering (BSECE)",
    "Bachelor of Science in Industrial Engineering (BSIE)",
    "Bachelor of Science in Mechanical Engineering (BSME)",
    "Bachelor of Science in Railway Engineering (BSRE)",
  ],
  "College of Human Kinetics (CHK)": [
    "Bachelor of Physical Education (BPE)",
    "Bachelor of Science in Exercises and Sports (BSESS)",
  ],
  "College of Law (CL)": [
    "Juris Doctor (JD)",
  ],
  "College of Political Science and Public Administration (CPSPA)": [
    "Doctor in Public Administration (DPA)",
    "Master in Public Administration (MPA)",
    "Bachelor of Public Administration (BPA)",
    "Bachelor of Arts in International Studies (BAIS)",
    "Bachelor of Arts in Political Economy (BAPE)",
    "Bachelor of Arts in Political Science (BAPS)",
  ],
  "College of Social Sciences and Development (CSSD)": [
    "Bachelor of Arts in History (BAH)",
    "Bachelor of Arts in Sociology (BAS)",
    "Bachelor of Science in Cooperatives (BSC)",
    "Bachelor of Science in Economics (BSE)",
    "Bachelor of Science in Psychology (BSPSY)",
  ],
  "College of Science (CS)": [
    "Bachelor of Science in Food Technology (BSFT)",
    "Bachelor of Science in Applied Mathematics (BSAPMATH)",
    "Bachelor of Science in Biology (BSBIO)",
    "Bachelor of Science in Chemistry (BSCHEM)",
    "Bachelor of Science in Mathematics (BSMATH)",
    "Bachelor of Science in Nutrition and Dietetics (BSND)",
    "Bachelor of Science in Physics (BSPHY)",
    "Bachelor of Science in Statistics (BSSTAT)",
  ],
  "College of Tourism, Hospitality and Transportation Management (CTHTM)": [
    "Bachelor of Science in Hospitality Management (BSHM)",
    "Bachelor of Science in Tourism Management (BSTM)",
    "Bachelor of Science in Transportation Management (BSTRM)",
  ],
};

export const collegeOptions = Object.keys(collegeCourses).map(college => ({
  value: college,
  label: college
}));

export const getCoursesForCollege = (selectedCollege) => {
  if (!selectedCollege || !collegeCourses[selectedCollege]) {
    return [];
  }
  
  return collegeCourses[selectedCollege].map(course => ({
    value: course,
    label: course
  }));
};

export default collegeCourses;
