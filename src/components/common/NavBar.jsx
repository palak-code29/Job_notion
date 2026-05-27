import React, { useEffect, useState } from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { AiOutlineShoppingCart, AiOutlineMenu } from "react-icons/ai";
import { IoIosArrowDown } from "react-icons/io";
import toast from "react-hot-toast";

import logo from "../../assets/Logo/Logo-Full-Light.png";
import { NavbarLinks } from "../../data/navbar-links";
import ProfileDropdown from "../core/Auth/ProfileDropDown";

import { apiconnector } from "../../services/apiconnector";
import { categories } from "../../services/apis";
import { ACCOUNT_TYPE } from "../../utils/constants";

function NavBar() {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const { totalItems } = useSelector((state) => state.cart);

  const [subLinks, setSubLinks] = useState([]);

  const location = useLocation();

  const matchRoute = (route) => {
    return matchPath({ path: route }, location.pathname);
  };

  // ✅ Fetch categories safely
  const fetchCategories = async () => {
    try {
      const result = await apiconnector("GET", categories.CATEGORIES_API);

      const data = result?.data?.allCategory || [];

      // ❌ remove invalid categories (no name)
      const cleanData = Array.isArray(data)
        ? data.filter((item) => item?.name)
        : [];

      setSubLinks(cleanData);
    } catch (error) {
      console.log("Category Fetch Error:", error);
      toast.error("Failed to load categories");
      setSubLinks([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="flex h-14 items-center justify-center border-b-[1px] border-richblack-700 bg-richblack-800">
      <div className="flex w-11/12 max-w-maxContent items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img src={logo} alt="logo" width={160} />
        </Link>

        {/* Navbar Links */}
        <nav>
          <ul className="flex gap-x-6 text-richblack-25">
            {NavbarLinks.map((link, index) => (
              <li key={index}>
                {link.title === "Catalog" ? (
                  <div className="relative group flex items-center gap-2 cursor-pointer">
                    <p>{link.title}</p>
                    <IoIosArrowDown />

                    {/* Dropdown */}
                    <div className="invisible absolute left-1/2 top-full flex -translate-x-1/2 translate-y-4 flex-col gap-2 rounded-md bg-richblack-5 p-4 text-richblack-900 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 lg:w-[300px] z-50">
                      <div className="absolute left-[50%] -top-1 h-6 w-6 -translate-x-1/2 rotate-45 bg-richblack-5"></div>

                      {/* Categories */}
                      {subLinks.length > 0 ? (
                        subLinks.map((item, i) => {
                          const name = item.name;

                          const slug = name.split(" ").join("-").toLowerCase();

                          return (
                            <Link
                              key={i}
                              to={`/catalog/${slug}`}
                              className="border border-richblack-25 px-2 py-1"
                            >
                              {name}
                            </Link>
                          );
                        })
                      ) : (
                        <p className="text-sm text-richblack-600">
                          No Categories Found
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <Link to={link.path || "#"}>
                    <p
                      className={`${
                        matchRoute(link.path)
                          ? "text-yellow-25"
                          : "text-richblack-25"
                      }`}
                    >
                      {link.title}
                    </p>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Side */}
        <div className="hidden items-center gap-x-4 md:flex">
          {/* Cart */}
          {user?.accountType === ACCOUNT_TYPE.STUDENT && (
            <Link to="/dashboard/cart" className="relative">
              <AiOutlineShoppingCart className="text-2xl" />
              {totalItems > 0 && (
                <span className="absolute -bottom-2 -right-2 h-5 w-5 grid place-items-center rounded-full bg-richblack-600 text-xs text-yellow-100">
                  {totalItems}
                </span>
              )}
            </Link>
          )}

          {/* Login */}
          {!token && (
            <Link to="/login">
              <button className="px-3 py-1 border rounded">Login</button>
            </Link>
          )}

          {/* Signup */}
          {!token && (
            <Link to="/signup">
              <button className="px-3 py-1 border rounded">Signup</button>
            </Link>
          )}

          {/* Profile */}
          {token && <ProfileDropdown />}
        </div>

        {/* Mobile */}
        <button className="md:hidden">
          <AiOutlineMenu size={24} />
        </button>
      </div>
    </div>
  );
}

export default NavBar;
