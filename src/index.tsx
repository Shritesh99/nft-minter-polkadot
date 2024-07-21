import { serveStatic } from "@hono/node-server/serve-static";
import { Button, Frog } from "frog";
import { devtools } from "frog/dev";
import { ApiPromise, WsProvider, Keyring } from "@polkadot/api";
import { createSystem } from "frog/ui";

const { Image } = createSystem();

const { NEXT_PUBLIC_URL, POLKADOT_WS_URL } = process.env;

const provider = new WsProvider(POLKADOT_WS_URL);
const keyring = new Keyring();

export const app = new Frog({ title: "Pallet NFT" });

app.use("/*", serveStatic({ root: "./public" }));

let collectionId = 1;
let itemId = 8;

let imageUrl = "";
app.frame("/", async (c) => {
	let alreadyMinted = false;
	let account: Account | null = null;
	let isMint = c.buttonValue === "mint";
	let img1 = "https://picsum.photos/700/600";
	const api = await ApiPromise.create({ provider });

	if (imageUrl !== "" && !isMint) {
		const nfts = await api.query.templateModule.nfts(
			collectionId,
			itemId
		);
		// console.log(nfts.toJSON());
		const json = nfts.toJSON();
		console.log(isMint);
		imageUrl = hexToBytes(json.metadata);
		const f = await fetch(imageUrl);
		img1 = f.url;
		console.log(img1);
		// console.log(img1);
	}
	console.log(img1);
	if (c.frameData && isMint) {
		account = await fetch(
			`https://fnames.farcaster.xyz/transfers?fid=${c.frameData.fid}`
		)
			.then((r) => r.json())
			.then((r) => r.transfers[0]);

		const tokenId = c.frameData.timestamp;

		// const a = await api.tx.templateModule.mint(
		// 	collectionId,
		// 	itemId + 1,
		// 	"https://picsum.photos/700/600",
		// 	"5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
		// 	true
		// );
		// console.log(a);
		// return c.res({
		// 	image: (
		// 		<div
		// 			style={{
		// 				display: "flex",
		// 				width: "100%",
		// 				height: "100%",
		// 				justifyContent: "center",
		// 				alignItems: "center",
		// 				backgroundImage: `url("${img1.url}")`,
		// 				// backgroundSize: "cover",
		// 				backgroundRepeat: "no-repeat",
		// 				backgroundPosition: "center centre",
		// 				backgroundSize: "cover",
		// 			}}>
		// 			<span style={{ color: "white", fontSize: "50px" }}>
		// 				{`NFT Minted to ${account.username} 🏆`}
		// 			</span>
		// 		</div>
		// 	),
		// 	intents: [
		// 		<Button.Redirect location={`${NEXT_PUBLIC_URL}/check`}>
		// 			Check Minted
		// 		</Button.Redirect>,
		// 	],
		// });
	}
	// isMint = false;

	return c.res({
		image: (
			<div
				style={{
					display: "flex",
					width: "100%",
					height: "100%",
					justifyContent: "center",
					alignItems: "center",
					backgroundImage: `url("${img1}")`,
					// backgroundSize: "cover",
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center centre",
					backgroundSize: "cover",
				}}>
				<span style={{ color: "white", fontSize: "50px" }}>
					{alreadyMinted
						? "NFT Already Minted"
						: isMint
						? `NFT Minted to ${account.username} 🏆`
						: "Click Mint to mint a free NFT 🖼"}
				</span>
			</div>
		),
		intents: isMint
			? [
					<Button.Redirect location="/check">
						Check Minted
					</Button.Redirect>,
			  ]
			: [<Button value="mint">Mint</Button>],
	});
});

app.post("/check", (c) => {
	console.log("check");
	return c.redirect("/");
});

type Account = {
	owner: string;
	username: string;
};

function hexToBytes(hex: string) {
	let bytes = [];
	for (let c = 0; c < hex.length; c += 2)
		bytes.push(parseInt(hex.substr(c, 2), 16));
	return String.fromCharCode.apply(String, bytes);
}

// Convert a byte array to a hex string
function bytesToHex(bytes: string | any[]) {
	let hex = [];
	for (let i = 0; i < bytes.length; i++) {
		let current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
		hex.push((current >>> 4).toString(16));
		hex.push((current & 0xf).toString(16));
	}
	return hex.join("");
}

function hexToUtf8(hex: string) {
	console.log(hex);
	// Remove the '0x' prefix if it exists
	hex = hex.startsWith("0x") ? hex.slice(2) : hex;

	// Ensure the hex string length is even
	if (hex.length % 2 !== 0) {
		throw new Error("Invalid hex string");
	}

	// Convert hex string to byte array
	const bytes = [];
	for (let i = 0; i < hex.length; i += 2) {
		bytes.push(parseInt(hex.substr(i, 2), 16));
	}

	// Convert byte array to string
	const utf8String = new TextDecoder().decode(new Uint8Array(bytes));
	return utf8String;
}
devtools(app, { serveStatic });
