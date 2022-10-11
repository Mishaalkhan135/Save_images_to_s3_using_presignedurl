import {
	Box,
	Input,
	Avatar,
	WrapItem,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalCloseButton,
	ModalBody,
	ModalFooter,
	useDisclosure,
	Button,
} from "@chakra-ui/react";
import { EditIcon } from "@chakra-ui/icons";
import React, { useState } from "react";
import axios from "axios";
import { fields, uploadToS3 } from "../../utils/uploadTos3";
import { useSelector } from "react-redux";
import { AppState } from "../../store/store";
import { PlatformAPIResponse } from "../../store/reducers/types";

const Uploader = () => {
	let user_id = useSelector<AppState>(
		(state) => state.user?.user?.user_id
	) as string;
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [displayIcon, setDisplayIcon] = useState(false);
	const [displayUploader, setDisplayUploader] = useState(false);

	const getPreSignedURL = async () => {
		try {
			const response = await axios.post(
				process.env.PLATFORM_API_URI,
				{
					query: `
						mutation ($user_id: String!) {
							update_user_profile(user_id: $user_id) {
								error {
									status_code
									message
								}
								pre_signed_url_object
							}
						}
						`,
					variables: {
						user_id,
					},
				},
				{
					headers: {
						"x-api-key": process.env.PLATFORM_API_KEY,
					},
				}
			);
			console.log("RES >> ", await response);

			const { pre_signed_url_object, error } = (await response.data.data
				.update_user_profile) as PlatformAPIResponse;

			console.log("RESP >> ", pre_signed_url_object);

			if (error) {
				// show error
				console.log("ERROR >> ", error);
			}

			return pre_signed_url_object;
		} catch (err) {
			console.log("Pre Signed ERROR >> ", err);
		}
	};
	const onImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		console.log("uploaded", e.target.files && e.target.files[0]);

		try {
			const uploadedFile = e.target.files;

			if (uploadedFile) {
				console.log("file", uploadedFile[0]);

				const getPresignedPostUrlObject = await getPreSignedURL();

				console.log("presignedUrl", getPresignedPostUrlObject);

				const parsedPresignedPostUrlData: {
					url: string;
					fields: fields;
				} = JSON.parse(getPresignedPostUrlObject);
				console.log("uploaded file", uploadedFile[0]);
				console.log("upload	", parsedPresignedPostUrlData.fields);

				await uploadToS3(
					uploadedFile[0],
					parsedPresignedPostUrlData.fields
				);
				console.log("done");
			}
		} catch (e) {
			console.log(e);
		}
	};

	return (
		<Box>
			<Box
				style={{
					position: "relative",
					width: "130px",
					height: "130px",
					cursor: "pointer",
					overflow: "hidden",
				}}
				onMouseEnter={() => {
					setDisplayIcon(true);
				}}
				onMouseOver={() => {
					setDisplayIcon(true);
				}}
				onMouseOut={() => {
					setDisplayIcon(false);
				}}
			>
				<WrapItem>
					<Avatar
						src={`https://ecom-platform-api-test-images.s3.amazonaws.com/user/profile/${user_id}`}
						size={"2xl"}
						borderRadius={"md"}
					/>
				</WrapItem>
				<div
					style={{
						position: "absolute",
						top: `${displayIcon ? "50%" : "200%"}`,
						left: "50%",
						transform: "translate(-50%,-50%)",
						width: "100%",
						height: "100%",
						backgroundColor: "rgba(0, 0, 0, 0.71)",
						transition: "all 300ms linear",
						borderRadius: "5px",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						color: "white",
					}}
					onClick={onOpen}
				>
					<EditIcon fontSize={"3xl"} />
				</div>
			</Box>
			<div
				style={{
					position: "absolute",
					top: "0",
					backgroundColor: "gray",
					display: `${displayUploader ? "block" : "none"}`,
				}}
			>
				<Box>
					<Modal isOpen={isOpen} onClose={onClose}>
						<ModalOverlay />
						<ModalContent>
							<ModalHeader alignSelf={"center"}>
								Upload Your Image
							</ModalHeader>
							<ModalCloseButton />
							<ModalBody alignSelf={"center"}>
								<Input type={"file"} onChange={onImageUpload} />
							</ModalBody>

							<ModalFooter alignSelf={"center"} w={"100%"}>
								<Button
									onClick={onClose}
									bgColor='teal'
									color={"white"}
									w={"100%"}
									borderRadius={"sm"}
								>
									Close
								</Button>
							</ModalFooter>
						</ModalContent>
					</Modal>
				</Box>
			</div>
		</Box>
	);
};

export default Uploader;
