import { NextSeo } from "next-seo";
import { ReactNode, useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import { User } from "../../types";
import Footer from "../Footer";
import Navbar from "../Navbar";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Announcement } from "src/pages/control/website/announcements";

interface Props {
	children: ReactNode;
	title?: string;
	user?: User;
}

export default function Container({ children, title, user }: Props) {
	const [announcement, setAnnounement] = useState<Announcement>();
	const [announcementHidden, setAnnouncementHidden] = useState(false);

	useEffect(() => {
		axios(`/api/website/announcements/latest`).then((data) => {
			if (data.data.content) {
				setAnnounement(data.data);
				if (localStorage.getItem("announcement-hide") == data.data.createdAt.toString()) {
					setAnnouncementHidden(true);
				}
			}
		});
	}, []);

	const hide = () => {
		localStorage.setItem("announcement-hide", announcement!.createdAt.toString());
		setAnnouncementHidden(true);
	};

	return (
		<>
			{title && <NextSeo title={`Dank Memer | ${title}`} />}
			<ToastContainer />
			{announcement && !announcementHidden && <Announcement content={announcement.content} close={hide} />}
			<div className="flex h-screen flex-col justify-between">
				<Navbar user={user} />
				<div className="mx-8 flex justify-center">
					<div className="relative w-full max-w-7xl">{children}</div>
				</div>
				<Footer />
			</div>
		</>
	);
}
