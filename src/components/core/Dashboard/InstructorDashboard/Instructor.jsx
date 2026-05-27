import React, { useEffect, useState } from "react";
import { fetchInstructorDashboardData } from "../../../../services/operations/profileAPI";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import InstructorChart from "./InstructorChart";

function Instructor() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchInstructorDashboardData(token, setLoading);
      console.log("res", res);

      if (res) {
        setData(res);
        setCourses(res?.courses || []);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-[calc((h-screen)-60px)] text-richblack-5">
      <div className="flex flex-col gap-y-2 mx-auto">
        <div className="flex flex-col gap-y-2">
          <p className="text-2xl font-semibold text-start font-inter">
            Hi {user.firstName} 👋
          </p>
          <p>Let's Start Something New!</p>
        </div>

        <div>
          {loading ? (
            <div className="spinner"></div>
          ) : courses?.length === 0 ? (
            <div>
              <p>You Have Not Created Any Course Yet!</p>

              <Link to={"/dashboard/add-course"}>
                <p>Add Course</p>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-y-5">
              <div className="flex flex-row items-center justify-between h-auto">
                {courses?.length === 0 || data.noOfStudentsEnrolled === 0 ? (
                  <div className="w-[73%] h-full bg-richblue-800 border-richblack-600 flex items-center justify-center rounded-md p-4 min-h-[240px]">
                    <div className="text-richblack-50 text-xl font-semibold">
                      No Data Found !
                    </div>
                  </div>
                ) : (
                  <InstructorChart courses={courses} />
                )}

                <div className="bg-richblack-800 border-richblack-600 rounded-md p-4 w-[25%]">
                  <p className="text-md font-semibold">Statistics</p>

                  <div className="mt-4">
                    <div>
                      <p className="text-richblack-300">Total Courses</p>
                      <p className="text-richblack-200 font-semibold text-2xl">
                        {data.noOfCourses}
                      </p>
                    </div>

                    <div>
                      <p className="text-richblack-300">Total Students</p>
                      <p className="text-richblack-200 font-semibold text-2xl">
                        {data.noOfStudentsEnrolled}
                      </p>
                    </div>

                    <div>
                      <p className="text-richblack-300">Total Income</p>
                      <p className="text-richblack-200 font-semibold text-2xl">
                        Rs. {data.totalIncome}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col gap-y-3 bg-richblack-800 p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-semibold">Your Courses</p>

                  <Link to={"/dashboard/my-courses"}>
                    <p className="text-yellow-25 text-sm">view all</p>
                  </Link>
                </div>

                <div className="flex flex-col lg:flex-row items-center lg:gap-x-3 ">
                  {courses.slice(0, 3).map((course, index) => (
                    <div key={index} className="flex flex-col">
                      <img
                        src={course.thumbNail}
                        alt="courseThumbnail"
                        className="w-[320px] h-[180px] rounded-md"
                      />

                      <div className="mt-4 pl-2">
                        <p className="text-richblack-400">
                          {course.courseName}
                        </p>

                        <div className="flex items-center gap-x-2 text-xs text-richblack-100">
                          <p>{course.studentsEnrolled.length} students</p>
                          <p> | </p>
                          <p>Rs. {course.price}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Instructor;
