import axios from "axios";
import clsx from "clsx";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BannerPage } from "src/components/community/PagedBanner";
import ControlPanelContainer from "src/components/control/Container";
import ControlLinks from "src/components/control/ControlLinks";
import CreatedBannerCard from "src/components/control/store/CreatedBannerCard";
import LoadingPepe from "src/components/LoadingPepe";
import { Title } from "src/components/Title";
import Button from "src/components/ui/Button";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";
import SimpleBar from "simplebar-react";
import "simplebar/dist/simplebar.min.css";

export default function StoreBanners({ user }: PageProps) {
	const [loading, setLoading] = useState(true);
	const [banners, setBanners] = useState<BannerPage[]>([]);

	const router = useRouter();

	useEffect(() => {
		axios("/api/store/banners/list")
			.then(({ data }) => {
				setBanners(data);
			})
			.catch((e) => {
				console.error(e.message);
				toast.error(e.response.data.message);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return (
		<ControlPanelContainer title="Store Banners" links={<ControlLinks user={user!} />}>
			<div className="flex items-center justify-between">
				<Title size="big">Store banners</Title>
				<Button variant="primary" onClick={() => router.push("/control/store/banners/editor")}>
					Create new Banner
				</Button>
			</div>
			<section className="mt-8">
				<SimpleBar className="max-h-96 short:max-h-[650px] tall:max-h-[770px]">
					{!loading ? (
						banners.length >= 1 ? (
							<>
								<svg
									className="imageBlur"
									style={{
										height: "1px",
										width: "1px",
										margin: "-1px",
										position: "absolute",
										zIndex: -1,
									}}
								>
									<filter id="sharpBlur">
										<feGaussianBlur stdDeviation="0.78"></feGaussianBlur>
										<feColorMatrix
											type="matrix"
											values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 9 0"
										></feColorMatrix>
										<feComposite in2="SourceGraphic" operator="in"></feComposite>
									</filter>
								</svg>
								<div
									className="mt-4 grid justify-between gap-x-5 gap-y-7"
									style={{
										gridTemplateColumns: "repeat(auto-fit, minmax(288px, auto))",
									}}
								>
									{banners.map((banner) => (
										<CreatedBannerCard banner={banner} />
									))}
								</div>
							</>
						) : (
							<p>No banners :/</p>
						)
					) : (
						<LoadingPepe />
					)}
				</SimpleBar>
			</section>
		</ControlPanelContainer>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(developerRoute);
