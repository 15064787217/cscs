"use strict";
const teacher = require("./teacher");
const student = require("./student");
const dialogs = require("./dialogs");

window.$("input[type=password]").attr("value", 123456);

let stuList;

function loop(students) {
	const student = students.pop();
	if (!student) {
		return;
	}
	let stuOpt;
	Array.from(stuList.options).some((option, i) => {
		if (option.label === student.name || option.value === student.name) {
			stuOpt = option;
			stuList.selectedIndex = i;
			return option;
		}
	});

	return student.doWorks().then(() => {
		if (stuOpt) {
			stuOpt.disabled = true;
		}
		return loop(students);
	}).catch(ex => {
		if (ex && ex.userid) {
			console.error(student.name + "登陆失败，跳过。");
			return loop(students);
		}
		throw ex;
	});
}

const userName = localStorage.getItem("teacher_user_name") || "";

function teacherLogin() {
	return dialogs.prompt("请输入教师用户名", userName).then(teacher.login).catch(teacherLogin);
}

teacherLogin().then(teacherInfo => {
	console.log("教师登陆成功", teacherInfo.truename);
	return teacher.getStudents();
}).then(students => {
	console.log("学生账号清单", students);
	const select = document.createElement("select");
	Object.keys(students).forEach((name, i) => {
		select.options[i] = new Option(name, students[name]);
	});

	// select.onchange = function() {
	// 	Array.from(select.selectedOptions).map(option => student(option.label).login());
	// };

	select.style.position = "absolute";
	select.style.height = "135px";
	select.style.left = 0;
	select.style.top = 0;

	select.multiple = true;
	// select.disabled = true;
	setTimeout(() => {
		document.documentElement.lastChild.appendChild(select);
	}, 1000);
	stuList = select;
	return teacher.getWorks();
}).then(works => {
	const unfinishedStudents = Object.keys(works);
	if (unfinishedStudents.length) {
		return dialogs.confirm(`发现${ unfinishedStudents.length }名同学未完作业，是否开始答题？`).then(ok => {
			if (ok) {
				return loop(unfinishedStudents.map(student)).then(() => {
					return dialogs.alert("所有同学的作业都做完了。");
				});
			}
		});
	} else {
		return dialogs.alert("所有同学均已完成作业。");
	}
}).then(result => {
	const {ipcRenderer} = require("electron");
	ipcRenderer.send("worker.finish", result);
});