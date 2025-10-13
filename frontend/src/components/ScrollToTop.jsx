import { useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Cuộn lên đầu mỗi khi đổi route
    window.scrollTo({ top: 0, left: 0, behavior: "instant" }); // hoặc "smooth"
  }, [pathname]);

  return null;
}
