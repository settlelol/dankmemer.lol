import axios from "axios";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import PagedBanner, { BannerPage } from "src/components/community/PagedBanner";
import LoadingPepe from "src/components/LoadingPepe";
import BannerEditor from "src/components/store/BannerEditor";
import Input from "src/components/store/Input";
import { Title } from "src/components/Title";
import Box from "src/components/ui/Box";
import Button from "src/components/ui/Button";
import Container from "src/components/ui/Container";
import Switch from "src/components/ui/Switch";
import { PageProps } from "src/types";
import { developerRoute } from "src/util/redirects";
import { withSession } from "src/util/session";

export default function StoreBanners({ user }: PageProps) {
	const [loading, setLoading] = useState(true);
	const [banners, setBanners] = useState<BannerPage[]>([]);
	const [creating, setCreating] = useState(false);

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
		<Container title="Blog Editor" user={user}>
			<div className="my-16">
				<div className="flex items-center justify-between">
					<Title size="big">Manage store banners</Title>
					<Button variant={creating ? "danger" : "primary"} onClick={() => setCreating((curr) => !curr)}>
						{creating ? "Close" : "Open"} Banner Creator
					</Button>
				</div>
				<div className="my-4 flex flex-col space-y-8">
					{creating && <BannerEditor />}
					<div className="py-5">
						<Title size="medium" className="font-semibold">
							Existing Banners
						</Title>
						{!loading ? (
							banners.length >= 1 ? (
								<div className="flex flex-col space-y-8">
									<PagedBanner pages={banners} />
								</div>
							) : (
								<p>No banners :/</p>
							)
						) : (
							<LoadingPepe />
						)}
					</div>
				</div>
			</div>
		</Container>
	);
}

export const getServerSideProps: GetServerSideProps = withSession(developerRoute);
