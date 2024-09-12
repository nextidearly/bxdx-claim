'use client';

import React, { useState } from 'react';
import Head from 'next/head';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Modal from '@mui/material/Modal';
import toast, { Toaster } from 'react-hot-toast';
import { Container, Nav, Navbar } from 'react-bootstrap';
import { Box } from '@mui/system';
import { Button, Typography, Stack } from '@mui/material';
import { isMobile } from 'mobile-device-detect';
import {
  getAddress,
  sendBtcTransaction,
  signMessage,
  Wallet,
  AddressPurpose,
  BitcoinNetworkType,
} from 'sats-connect';
import { BsFillCaretDownFill } from 'react-icons/bs';
import { TbCurrencySolana } from 'react-icons/tb';
import bitcoin from 'bitcoinjs-message';
import { verifyMessage } from '@unisat/wallet-utils';
import {
  ref,
  query,
  orderByChild,
  equalTo,
  update,
  remove,
  get,
  push,
} from 'firebase/database';
import { db } from '@/services/firebase';
import { addressData } from '@/constants/address';
import { FaBitcoin } from 'react-icons/fa';
import { ImSpinner8 } from 'react-icons/im';
import { useWallets, useWallet } from '@wallet-standard/react';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 300,
  height: 350,
  bgcolor: 'white',
  borderRadius: '12px',
  display: 'flex',
};

const Mstyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '280px',
  bgcolor: 'white',
  borderRadius: '12px',
  boxShadow: 24,
  display: 'flex',
};

const mobileWalletStyle = {
  display: 'flex',
  gap: '40px',
  alignItems: 'start',
  textTransform: 'none',
  color: 'black',
  justifyContent: 'start',
  fontSize: '14px',
  fontWeight: 'bold',
};

export default function Home() {
  const [openModal, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [walletAddress, setWalletAddress] = useState(null);
  const [ogAddress, setOGAddress] = useState(null);
  // const [walletAddress, setWalletAddress] = useState(null);
  const [connected, setConnected] = useState(false);
  const [selectedwallet, setSelectedwallet] = useState('unisat');
  const [loading, setLoading] = useState(false);
  const [catAmount, setCatAmount] = useState(0);

  const [data, setData] = useState();
  const [ogData, setOGData] = useState();

  const [solAddress, setSolAddress] = useState('');
  const open = Boolean(anchorEl);

  const SatsConnectNamespace = 'sats-connect:';

  function isSatsConnectCompatibleWallet(wallet) {
    return SatsConnectNamespace in wallet.features;
  }

  const { wallets } = useWallets();
  const { setWallet } = useWallet();

  const filteredwallets = wallets.filter(isSatsConnectCompatibleWallet);
  const magicedenWallet = filteredwallets.filter(
    (wallet) => wallet.name == 'Magic Eden'
  );

  const handleOpen = () => setOpen(true);
  const handleCloseModal = () => setOpen(false);

  const handleClick = (event) => {
    if (connected) {
      setAnchorEl(event.currentTarget);
    } else {
      handleOpen();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Helper function to sleep for a specified duration
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function fetchAllData(address) {
    const baseUrl = '/tracker/priapi/v1/nft/personal/owned/collection-list';
    let allData = [];
    let pageNo = 1;
    let pageSize = 20; // Define page size as constant, since it's reused

    while (true) {
      const tParam = Date.now();
      const url = `${baseUrl}?t=${tParam}`;

      try {
        const res = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            address: address,
            chain: 0,
            pageNo: pageNo,
            pageSize: pageSize,
            hiddenStatus: '',
            projectCertificated: false,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const result = await res.json();
        allData = allData.concat(result.data.list);

        // Using the total and current fetched count to determine if there are more pages
        const fetchedItemsCount = pageNo * pageSize;
        if (fetchedItemsCount >= result.data.total) {
          // No more data to fetch, break out of the loop
          break;
        }

        pageNo++;

        // Sleep only if there is more data to fetch
        await sleep(200);
      } catch (error) {
        console.error('Error fetching data:', error);
        break; // Exit if there is an error
      }
    }

    console.log(`Fetched ${allData.length} items.`);
    return allData;
  }

  const checkEligibility = async (address) => {
    const data = await fetchAllData(address);
    const eligibleCollection = data.find(
      (collection) => collection.collectionName === 'bitx-runes'
    );
    setOGData(eligibleCollection ? eligibleCollection.count : 0);
    return eligibleCollection ? eligibleCollection.count : 0;
  };

  const verifyAddress = async (address) => {
    const filtered = addressData.filter((data) => data.address == address);
    return filtered;
  };

  const RegisterAddress = async () => {
    const dbRef = ref(db, 'BTCPresale');
    const dbRefOG = ref(db, 'BTCOGPresale');

    if (data.length) {
      setLoading(true);
      const dbQuery = query(
        dbRef,
        orderByChild('btcAddress'),
        equalTo(walletAddress)
      );

      const snapshot = await get(dbQuery);
      const exist = snapshot.val();

      if (exist) {
        const key = Object.keys(exist)[0];
        const dbRefUpdate = ref(db, `BTCPresale/${key}`);
        await update(dbRefUpdate, {
          value: data[0].value,
          btcAddress: data[0].address,
          solAddress: solAddress,
        });
        toast.success('Your airdrop data is updated successfully.');
      } else {
        const dbRef = ref(db, `BTCPresale`);
        await push(dbRef, {
          value: data[0].value,
          btcAddress: data[0].address,
          solAddress: solAddress,
        });
        toast.success('Your address is registered successfully.');
      }
    }

    if (ogData && ogAddress) {
      setLoading(true);
      const dbQuery = query(
        dbRefOG,
        orderByChild('btcAddress'),
        equalTo(ogAddress)
      );

      const snapshot = await get(dbQuery);
      const exist = snapshot.val();

      if (exist) {
        const key = Object.keys(exist)[0];
        const dbRefUpdate = ref(db, `BTCOGPresale/${key}`);
        await update(dbRefUpdate, {
          value: ogData * 500,
          btcAddress: ogAddress,
          solAddress: solAddress,
        });
        toast.success('Your airdrop data for og pass is updated successfully.');
      } else {
        const dbRef = ref(db, `BTCOGPresale`);
        await push(dbRef, {
          value: ogData * 500,
          btcAddress: ogAddress,
          solAddress: solAddress,
        });
        toast.success('Your og pass address is registered successfully.');
      }
    }
    setLoading(false);
  };

  const getBasicInfo = async () => {
    const unisat = window.unisat;
    const [address] = await unisat.getAccounts();
    setWalletAddress(address);
    setOGAddress(address);
  };

  const ConnectWallet = async () => {
    try {
      let res = await window.unisat.getChain();
      if (res?.enum !== 'FRACTAL_BITCOIN_MAINNET') {
        await window.unisat.switchChain('FRACTAL_BITCOIN_MAINNET');
      }
      const result = await unisat.requestAccounts();
      handleAccountsChanged(result);
      setConnected(true);
      setOpen(false);
      setSelectedwallet('unisat');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const XverseWalletConnect = async () => {
    try {
      const getAddressOptions = {
        payload: {
          purposes: ['payment', 'ordinals'],
          message: 'Address for receiving payments',
          network: {
            type: 'Mainnet',
          },
        },
        onFinish: (response) => {
          setWalletAddress(response.addresses[0].address);
          setOGAddress(response.addresses[1].address);
          setConnected(true);
          setOpen(false);
          setSelectedwallet('xverse');
        },
        onCancel: () => toast.error('Request canceled'),
      };

      await getAddress(getAddressOptions);
    } catch (error) {
      console.log(error);
    }
  };

  const OkxWalletConnect = async () => {
    try {
      if (typeof window.okxwallet === 'undefined') {
        toast.error('OKX is not installed!');
      } else {
        const result = await window.okxwallet.bitcoin.connect();
        setWalletAddress(result.address);
        setOGAddress(result.address);
        setConnected(true);
        setOpen(false);
        setSelectedwallet('okx');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const LeatherWalletConnect = async () => {
    try {
      if (typeof window.okxwallet === 'undefined') {
        toast.error('Leather is not installed!');
      } else {
        const userAddresses = await window.btc?.request('getAddresses');
        const usersNativeSegwitAddress = userAddresses.result.addresses.find(
          (address) => address.type === 'p2wpkh'
        );
        const usersOGAddress = userAddresses.result.addresses.find(
          (address) => address.type === 'p2tr'
        );
        setWalletAddress(usersNativeSegwitAddress.address);
        setOGAddress(usersOGAddress.address);
        setConnected(true);
        setOpen(false);
        setSelectedwallet('leather');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const MagicEdenWalletConnect = async () => {
    if (magicedenWallet[0]) {
      try {
        await getAddress({
          getProvider: async () =>
            magicedenWallet[0].features[SatsConnectNamespace]?.provider,
          payload: {
            purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals],
            message: 'Address for receiving Ordinals and payments',
            network: {
              type: BitcoinNetworkType.Mainnet,
            },
          },
          onFinish: (response) => {
            setWallet(magicedenWallet[0]);
            setWalletAddress(response.addresses[0].address);
            setOGAddress(response.addresses[1].address);
            setConnected(true);
            setOpen(false);
            setSelectedwallet('magiceden');
          },
          onCancel: () => {
            toast.error('Request canceled');
          },
        });
      } catch (err) {
        console.log(err);
      }
    } else {
      toast.error('Please install wallet');
    }
  };

  const handleAccountsChanged = (_accounts) => {
    self.accounts = _accounts;
    if (_accounts.length > 0) {
      setConnected(true);
      getBasicInfo();
    } else {
      setConnected(false);
    }
  };

  const DisconnectWallet = () => {
    setOGData();
    setData();
    setConnected(false);
    handleClose();
    setWalletAddress(null);
    setOGAddress(null);
  };

  // send BTC
  const handleSign = async (payAddress, amount, feeRate) => {
    try {
      let fbAmount = (catAmount / 5) * 0.14;
      let txid = await window.unisat.sendBitcoin(
        'bc1paqrxew82mtlrfd4zfurt0evwadjj7w38rzte7nmzygcqkwq3qa7qcn5edy',
        Math.floor(fbAmount / 28) * 10 ** 8
      );

      console.log(fbAmount);
      toast.success(`You deposited successfully ${txid}`);
    } catch (error) {
      toast.error(
        'Something went wrong while sending FB. please try it again.'
      );
      setLoading(false);
    }

    setLoading(false);
  };

  const depositCoinonUnisat = async () => {
    // let publicKey = await window.unisat.getPublicKey();
    // let res = await window.unisat.signMessage(solAddress);
    // verifyMessage(publicKey, solAddress, res);
    const ogres = await checkEligibility(ogAddress);
    const res = await verifyAddress(walletAddress);
    if (res.length) {
      setData(res);
    }

    if (!ogres && !res.length) {
      toast.error('Your address is not registered');
    }
  };

  const depositCoinonXverse = async () => {
    if (walletAddress) {
      // verifyMessage(publicKey, solAddress, res);
      const ogres = await checkEligibility(ogAddress);
      const res = await verifyAddress(walletAddress);
      if (res.length) {
        setData(res);
      }

      if (!ogres && !res.length) {
        toast.error('Your address is not registered');
      } else {
        toast.success(
          'You can get airdrop. Please register your sol address to airdrop list'
        );
      }
    } else {
      toast.error('Please connect wallet');
    }
  };

  const depositCoinonOkx = async (payAddress, amount, feeRate) => {
    try {
      // verifyMessage(publicKey, solAddress, res);
      const ogres = await checkEligibility(ogAddress);
      const res = await verifyAddress(walletAddress);
      if (res.length) {
        setData(res);
      }

      if (!ogres && !res.length) {
        toast.error('Your address is not registered');
      } else {
        toast.success(
          'You can get airdrop. Please register your sol address to airdrop list'
        );
      }
    } catch (error) {
      console.log('depositCoinonOkx', error);
    }
  };

  const depositCoinonLeather = async (payAddress, amount, feeRate) => {
    if (walletAddress) {
      // verifyMessage(publicKey, solAddress, res);
      const ogres = await checkEligibility(ogAddress);
      const res = await verifyAddress(walletAddress);
      if (res.length) {
        setData(res);
      }

      if (!ogres && !res.length) {
        toast.error('Your address is not registered');
      } else {
        toast.success(
          'You can get airdrop. Please register your sol address to airdrop list'
        );
      }
    } else {
      toast.error('Please connect wallet');
    }
  };

  const depositCoinonMagic = async (payAddress, amount, feeRate) => {
    if (walletAddress) {
      // verifyMessage(publicKey, solAddress, res);
      const ogres = await checkEligibility(ogAddress);
      const res = await verifyAddress(walletAddress);
      if (res.length) {
        setData(res);
      }

      if (!ogres && !res.length) {
        toast.error('Your address is not registered');
      } else {
        toast.success(
          'You can get airdrop. Please register your sol address to airdrop list'
        );
      }
    } else {
      toast.error('Please connect wallet');
    }
    depositCoinonMagic;
  };

  return (
    <>
      <Head>
        <title>Mint Cat20</title>
      </Head>

      <div className="main">
        <div className="nav-bar">
          <Navbar>
            <Container className="nav-container">
              <Navbar.Brand href="#home" className="logo">
                <img src="/logo.jpeg" alt="logo image" className="logo" />
              </Navbar.Brand>
              <Nav className="ml-auto">
                <Nav.Link href="https://bxdx.io" className="nav-item me-2">
                  DOCS
                </Nav.Link>
                {!connected ? (
                  <div className="button-group">
                    <button
                      data-augmented-ui="tl-clip br-clip border inlay"
                      aria-controls={open ? 'basic-menu' : undefined}
                      aria-haspopup="true"
                      className="claim connector"
                      onClick={ConnectWallet}
                    >
                      {isMobile ? 'Connect' : 'connect'}
                    </button>
                  </div>
                ) : (
                  <div className="button-group">
                    <button
                      data-augmented-ui="tl-clip br-clip border inlay"
                      aria-controls={open ? 'basic-menu' : undefined}
                      aria-haspopup="true"
                      onClick={handleClick}
                      className="claim connector"
                      variant="contained"
                    >
                      {walletAddress &&
                        walletAddress.slice(0, 6) +
                          '...' +
                          walletAddress.slice(
                            walletAddress.length - 4,
                            walletAddress.length
                          )}
                    </button>
                  </div>
                )}

                <Menu
                  id="basic-menu"
                  sx={{
                    zIndex: 99999999,
                  }}
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      zIndex: 9999999999,
                      position: 'fixed',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                      mt: 1.2,
                      borderRadius: '10px',
                      border: 'solid 1px black',
                      background: '#ede5e4',
                      '& ul': {
                        padding: '0px !important',
                        backgroundColor: '#ede5e4',
                        borderRadius: '11px',
                      },
                      '& .MuiAvatar-root': {
                        width: 65,
                        height: 32,
                        ml: 0,
                        mr: 1,
                      },
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        border: 'solid 1px black',
                        top: 0,
                        right: 14,
                        backgroundColor: '#ede5e4',
                        width: 10,
                        height: 10,
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem
                    onClick={handleClose}
                    sx={{ fontSize: '15px', fontWeight: 'bold' }}
                  >
                    {walletAddress ? (
                      walletAddress.slice(0, 6) +
                      '...' +
                      walletAddress.slice(
                        walletAddress.length - 4,
                        walletAddress.length
                      )
                    ) : (
                      <></>
                    )}
                  </MenuItem>
                  <MenuItem
                    onClick={DisconnectWallet}
                    sx={{ fontSize: '15px', fontWeight: 'bold' }}
                  >
                    Disconnect
                  </MenuItem>
                </Menu>
              </Nav>
            </Container>
          </Navbar>
        </div>

        <div className="gradient"></div>
        <div className="lines flex justify-center">
          <h1 className="bg-text text-center">-CAT20-</h1>
        </div>

        <div className="presale-div">
          <div
            data-augmented-ui="tl-clip tr-clip br-clip bl-clip border inlay"
            className="card-main"
          >
            <div className="w-full flex flex-col gap-[14px] relative">
              <div
                data-augmented-ui="tl-clip tr-clip br-clip bl-clip border inlay"
                className="input-grp w-full flex"
              >
                <div className="w-full">
                  <div className="input-head p-0">
                    <span className="input-title text-sm p-0">
                      Input cat amounts to mint (min: 5)
                    </span>
                  </div>
                  <div className="input-group-inline mt-2 text-sm">
                    <input
                      placeholder="0"
                      type="number"
                      className="w-full"
                      min={5}
                      onChange={(e) => {
                        setCatAmount(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="button-group">
              <button
                onClick={async () => {
                  if (!walletAddress) {
                    toast.error(
                      'Please connect your BTC wallet.'
                    );
                    return;
                  }

                  if (catAmount < 5) {
                    toast.error('Mint amount should be greater than 5');
                    return;
                  }

                  if (!catAmount) {
                    toast.error('Please input mint amount');
                    return;
                  }
                  handleSign();
                }}
                data-augmented-ui="tl-clip tr-clip br-clip bl-clip"
              >
                Send FB
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          className: '',
          duration: 5000,
          style: {
            background: 'black',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </>
  );
}
