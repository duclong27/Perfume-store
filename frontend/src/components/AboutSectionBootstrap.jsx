import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { assets } from "../assets/assets";
import perfume_video from "../assets/perfume_video.mp4";


export default function AboutSectionBootstrap({
  className = "",
  videoSrc = perfume_video,
  videoPoster = perfume_video,
  badgeLabel = assets.cart_icon,
  title = "Tiêu đề nội dung của bạn",
  description = "Mô tả ngắn gọn, trung tính. Viết 1–2 câu nhấn mạnh giá trị, không mang tính bán hàng.",
  items = [
    { href: "#", iconSrc: assets.cart_icon, label: "Mục số 1", alt: "" },
    { href: "#", iconSrc: assets.menu_icon, label: "Mục số 2", alt: "" },
    { href: "#", iconSrc: assets.profile_icon, label: "Mục số 3", alt: "" },
  ],
}) {
  const videoRef = useRef(null);

  // Tôn trọng prefers-reduced-motion cho video + animate.css
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      if (videoRef.current) {
        videoRef.current.removeAttribute("autoplay");
        videoRef.current.pause?.();
      }
      // Ẩn class animate__animated nếu cần
      document
        .querySelectorAll(".animate__animated")
        .forEach((el) => el.classList.remove("animate__animated"));
    }
  }, []);

  return (
    <div className={`col-12 about_component ${className}`}>
      <div className="container">
        <div className="row">
          {/* Cột trái: video (giữ nguyên lớp) */}
          <div className="col-12 col-sm-12 col-md-12 col-lg-5 pt-0 pt-lg-5 p-4 d-none d-lg-block">
            <div
              className="video-fixed ms-auto rounded-5 overflow-hidden"
              style={{ width: "90%" }}
            >
              <video
                ref={videoRef}
                className="video-el animate_client animate__fadeInLeft animate__animated"
                data-animate="fadeInLeft"
                data-delay="1s"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                poster={videoPoster || undefined}
                style={{ animationDelay: "1s", visibility: "visible" }}
              >
                <source src={videoSrc} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            </div>
          </div>

          {/* Cột phải: nội dung (giữ nguyên lớp & data-animate) */}
          <div
            className="col-12 col-lg-7 ps-lg-5 info_about_component pt-0 p-4 animate_client animate__fadeInRight animate__animated"
            data-animate="fadeInRight"
            style={{ visibility: "visible" }}
          >
            <div className="col-12 col-lg-11 box_badge_about">
              <span className="badge_about background_client_color background_client_color_hover text-white font19 d-inline-block">
                {badgeLabel}
              </span>
            </div>

            <h2 className="col-12 col-lg-11 line_height_120 mt-4 mb-3 font36 font-weight-600 title_client_template color_client_primary">
              {title}
            </h2>

            <div className="col-12 col-lg-11 mb-3 font18">
              <p>
                {description}
                <br />
              </p>
            </div>

            <div className="col-12 col-lg-11">
              <ul className="list-unstyled">
                {items.map((it, idx) => {
                  const isExternal = it.href?.startsWith("http");
                  return (
                    <li className="mb-3" key={idx}>
                      <a
                        href={it.href || "#"}
                        className="d-flex align-items-center text-decoration-none color_client_text"
                        aria-label={it.label}
                        {...(isExternal
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        <div
                          className="me-3"
                          style={{ width: 42, height: 42, flexShrink: 0 }}
                        >
                          <img
                            src={it.iconSrc}
                            className="img-fluid rounded"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            alt={typeof it.alt === "string" ? it.alt : ""}
                            loading="lazy"
                          />
                        </div>
                        <div className="flex-grow-1">
                          <h3 className="font18 m-0">{it.label}</h3>
                        </div>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

AboutSectionBootstrap.propTypes = {
  className: PropTypes.string,
  videoSrc: PropTypes.string,
  videoPoster: PropTypes.string,
  badgeLabel: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      href: PropTypes.string,
      iconSrc: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      alt: PropTypes.string, // alt rỗng nếu icon trang trí
    })
  ),
};
