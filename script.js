// =================== CLEANUP OLD DATA ===================
(() => {
    const jobs = JSON.parse(localStorage.getItem('jobs')) || [];
    const applications = JSON.parse(localStorage.getItem('applications')) || {};
    const removedApplications = JSON.parse(localStorage.getItem('removedApplications')) || {};

    // Remove any removedApplications for non-existing jobs
    for (const user in removedApplications) {
        for (const jobIndex in removedApplications[user]) {
            if (jobIndex >= jobs.length) {
                delete removedApplications[user][jobIndex];
            }
        }
        if (Object.keys(removedApplications[user]).length === 0) {
            delete removedApplications[user];
        }
    }

    // Clean applications for non-existing jobs
    for (const user in applications) {
        applications[user] = applications[user].filter(j => j < jobs.length);
        if (applications[user].length === 0) {
            delete applications[user];
        }
    }

    localStorage.setItem('applications', JSON.stringify(applications));
    localStorage.setItem('removedApplications', JSON.stringify(removedApplications));
})();

// ================ REGISTRATION ================
document.getElementById('registerForm')?.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const phone = document.getElementById('phone').value;
    const disability = document.getElementById('disability').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    if(users.some(u => u.email === email)){
        alert('User already registered. Please login.');
        window.location.href = 'login.html';
        return;
    }

    users.push({name,email,password,phone,disability});
    localStorage.setItem('users', JSON.stringify(users));
    alert('Registration Successful 🎉 Redirecting to login...');
    setTimeout(()=>{window.location.href='login.html';},500);
});

// ================ LOGIN ================
document.getElementById('loginForm')?.addEventListener('submit', function(e){
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    let user = users.find(u => u.email === email && u.password === password);

    if(!user){
        alert('Invalid credentials!');
        return;
    }

    localStorage.setItem('loggedInUser', email);
    alert('Login Successful ✅ Redirecting to home page...');
    window.location.href = 'index.html';
});

// ================ LOGOUT ================
function logoutUser(){
    localStorage.removeItem('loggedInUser');
    closeModal();
    alert('Logout Successful ✅ Redirecting to login...');
    window.location.href = 'login.html';
}

// ================ JOB MANAGEMENT ================
document.getElementById('jobForm')?.addEventListener('submit', function(e){
    e.preventDefault();
    const jobTitle = document.getElementById('jobTitle').value;
    const jobDescription = document.getElementById('jobDescription').value;
    const jobPdf = document.getElementById('jobPdf')?.value;
    const jobBook = document.getElementById('jobBook')?.value;
    const jobVideo = document.getElementById('jobVideo')?.value;
    const jobAudio = document.getElementById('jobAudio')?.value;
    const jobDisability = document.getElementById('jobDisability')?.value;

    let jobs = JSON.parse(localStorage.getItem('jobs')) || [];
    jobs.push({
        title:jobTitle,
        description:jobDescription,
        pdf:jobPdf||null,
        book:jobBook||null,
        video:jobVideo||null,
        audio:jobAudio||null,
        disability:jobDisability
    });
    localStorage.setItem('jobs',JSON.stringify(jobs));
    alert('Job posted successfully!');
    document.getElementById('jobForm').reset();
    fetchAdminJobs();
});

// ================ FETCH JOBS (USER HOME PAGE) ================
function fetchJobs(){
    const jobList = document.getElementById('jobList');
    if(!jobList) return;

    const jobs = JSON.parse(localStorage.getItem('jobs')) || [];
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const applications = JSON.parse(localStorage.getItem('applications')) || {};
    const removedApplications = JSON.parse(localStorage.getItem('removedApplications')) || {};
    const userEmail = localStorage.getItem('loggedInUser');
    const currentUser = users.find(u=>u.email===userEmail);

    jobList.innerHTML = '';

    if(jobs.length === 0){
        jobList.innerHTML='<p>No jobs available right now. Please check back later.</p>';
        return;
    }

    jobs.forEach((job,index)=>{
        const li = document.createElement('li');
        let resources='';
        if(job.pdf) resources+='<p><a href="'+job.pdf+'" target="_blank">📄 PDF</a></p>';
        if(job.book) resources+='<p><a href="'+job.book+'" target="_blank">📚 Book</a></p>';
        if(job.video) resources+='<p><a href="'+job.video+'" target="_blank">🎥 Video</a></p>';
        if(job.audio) resources+='<p><a href="'+job.audio+'" target="_blank">🎵 Audio</a></p>';

        let canApply = true;
        let removedMsg = '';

        if(userEmail){
            const userApplied = applications[userEmail] && applications[userEmail].includes(index);
            const userRemoved = removedApplications[userEmail] && removedApplications[userEmail][index];

            // SHOW REMOVED ONLY IF USER APPLIED AND WAS REMOVED
            if(userApplied && userRemoved){
                removedMsg = '<p style="color:red;"><strong>Removed by Admin:</strong> '+removedApplications[userEmail][index]+'</p>';
                canApply = false;
            }

            // DISABLE APPLY BUTTON IF DISABILITY DOESN'T MATCH
            if(currentUser && job.disability!=='Any' && job.disability!==currentUser.disability){
                canApply = false;
            }
        }

        li.innerHTML=`
            <h3>${job.title}</h3>
            <p>${job.description}</p>
            ${resources}
            ${userEmail ? 
                (canApply ? '<button onclick="applyJob('+index+')">Apply</button>' : (removedMsg || '<p><em>You cannot apply for this job</em></p>')) 
                : '<p><em>Login to apply</em></p>'}
        `;
        jobList.appendChild(li);
    });
}

// ================ APPLY JOB ================
function applyJob(jobIndex){
    let userEmail=localStorage.getItem('loggedInUser');
    if(!userEmail){ alert('Please login to apply'); return; }
    let applications=JSON.parse(localStorage.getItem('applications')) || {};
    if(!applications[userEmail]) applications[userEmail]=[];
    if(applications[userEmail].includes(jobIndex)){ alert('Already applied'); return; }
    applications[userEmail].push(jobIndex);
    localStorage.setItem('applications',JSON.stringify(applications));
    alert('Application submitted!');
    fetchJobs();
}

// ================ MY APPLICATIONS ================
function fetchApplications(){
    const appList = document.getElementById('applicationList');
    if(!appList) return;

    const userEmail = localStorage.getItem('loggedInUser');
    if(!userEmail){ 
        appList.innerHTML = '<p>Login to view applications</p>'; 
        return; 
    }

    const jobs = JSON.parse(localStorage.getItem('jobs')) || [];
    const applications = JSON.parse(localStorage.getItem('applications')) || {};
    const removedApplications = JSON.parse(localStorage.getItem('removedApplications')) || {};

    appList.innerHTML = '';

    const userAppliedJobs = applications[userEmail] || [];

    if(userAppliedJobs.length === 0){
        appList.innerHTML = '<p>You have not applied to any jobs yet.</p>';
        return;
    }

    userAppliedJobs.forEach(jobIndex => {
        const job = jobs[jobIndex];
        if(job){
            const li = document.createElement('li');
            let resources = '';
            if(job.pdf) resources += '<p><a href="'+job.pdf+'" target="_blank">📄 PDF</a></p>';
            if(job.book) resources += '<p><a href="'+job.book+'" target="_blank">📚 Book</a></p>';
            if(job.video) resources += '<p><a href="'+job.video+'" target="_blank">🎥 Video</a></p>';
            if(job.audio) resources += '<p><a href="'+job.audio+'" target="_blank">🎵 Audio</a></p>';

            // SHOW REMOVED ONLY IF USER APPLIED AND WAS REMOVED
            const removedMsg = (removedApplications[userEmail] && removedApplications[userEmail][jobIndex])
                ? '<p style="color:red;"><strong>Removed by Admin:</strong> '+removedApplications[userEmail][jobIndex]+'</p>'
                : '<p style="color:green;"><strong>Status:</strong> Applied ✅</p>';

            li.innerHTML = `
                <h3>${job.title}</h3>
                <p>${job.description}</p>
                ${resources}
                ${removedMsg}
            `;
            appList.appendChild(li);
        }
    });
}

// ================ NAVIGATION ================
function goToApplications(){
    const user=localStorage.getItem('loggedInUser');
    if(!user){ alert('Please login first'); return; }
    window.location.href='my-applications.html';
}

// ================ PROFILE ================
function showProfile(){
    const userEmail=localStorage.getItem('loggedInUser');
    if(!userEmail) return;
    const users=JSON.parse(localStorage.getItem('users')) || [];
    const currentUser=users.find(u=>u.email===userEmail);
    if(!currentUser) return;
    const profileName=document.getElementById('profileName');
    if(profileName) profileName.textContent=currentUser.name;
}

function showProfileModal(){
    const userEmail=localStorage.getItem('loggedInUser');
    if(!userEmail) return;
    const users=JSON.parse(localStorage.getItem('users')) || [];
    const currentUser=users.find(u=>u.email===userEmail);
    if(!currentUser) return;

    const modal=document.getElementById('profileModal');
    const details=document.getElementById('profileDetails');
    details.innerHTML=`
        <p><strong>Name:</strong> ${currentUser.name}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Phone:</strong> ${currentUser.phone}</p>
        <p><strong>Disability:</strong> ${currentUser.disability}</p>
    `;
    modal.style.display='block';
}
function closeModal(){ document.getElementById('profileModal').style.display='none'; }

// ================ ADMIN PANEL ================
window.fetchAdminJobs = function(){
    const adminJobList = document.getElementById('adminJobList');
    if(!adminJobList) return;

    const jobs = JSON.parse(localStorage.getItem('jobs')) || [];
    const applications = JSON.parse(localStorage.getItem('applications')) || {};
    const removedApplications = JSON.parse(localStorage.getItem('removedApplications')) || {};

    adminJobList.innerHTML = '';

    jobs.forEach((job,index)=>{
        const li = document.createElement('li');

        let appliedUsers = [];
        for(const userEmail in applications){
            if(applications[userEmail].includes(index)) appliedUsers.push(userEmail);
        }

        let userHTML = appliedUsers.map(u=>{
            let reason = (removedApplications[u] && removedApplications[u][index]) ? removedApplications[u][index] : '';
            let removeBtn = reason ? '' : '<button onclick="removeApplication(\''+u+'\','+index+')">Remove</button>';
            return '<li>'+u+' '+removeBtn+' '+(reason? '- Reason: '+reason : '')+'</li>';
        }).join('');

        li.innerHTML = `
            <h3>${job.title}</h3>
            <p>${job.description}</p>
            <button onclick="removeJob(${index})" style="background:red;color:white;">Remove Job</button>
            <p><strong>Applied Users:</strong></p>
            <ul>${userHTML || '<li>No applications yet</li>'}</ul>
        `;
        adminJobList.appendChild(li);
    });
}

// ================ REMOVE JOB ================
window.removeJob=function(index){
    let jobs=JSON.parse(localStorage.getItem('jobs')) || [];
    jobs.splice(index,1);
    localStorage.setItem('jobs',JSON.stringify(jobs));
    fetchAdminJobs();
}

// ================ REMOVE APPLICANT ================
window.removeApplication=function(userEmail,jobIndex){
    let applications=JSON.parse(localStorage.getItem('applications')) || {};
    let removedApplications=JSON.parse(localStorage.getItem('removedApplications')) || {};
    if(!applications[userEmail]) return;

    let reason=prompt('Enter reason for removal:');
    if(!reason) return;

    applications[userEmail]=applications[userEmail].filter(j=>j!==jobIndex);
    if(!removedApplications[userEmail]) removedApplications[userEmail]={};
    removedApplications[userEmail][jobIndex]=reason;

    localStorage.setItem('applications',JSON.stringify(applications));
    localStorage.setItem('removedApplications',JSON.stringify(removedApplications));
    fetchAdminJobs();
}

// ================ INIT ================
document.addEventListener('DOMContentLoaded', ()=>{
    fetchJobs();
    fetchApplications();
    fetchAdminJobs();
    showProfile();
});
