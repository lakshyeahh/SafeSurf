"use client"
import React from "react"
import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AlertTriangle, ChevronDown, Globe, Settings, Shield, X, Info, CheckCircle, XCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


interface InfoItemProps {
    label: string
    value: string | number
    isGood: boolean
    tooltip: string
  }
  
  interface GeneralInfo {
    domainAge: string;
    globalRank: string;
    urlRedirects: string;
    tooLongUrl: string;
    tooDeepUrl: string;
  }
  
  interface SecurityDetails {
    httpStatusCode: number;
    hstsSupport: string;
    useOfUrlShortener: string;
  }
  
  interface TechnicalDetails {
    ipOfDomain: string;
    ipAddressPresentInUrl: string;
  }
  
  interface SslStatus {
    valid: boolean;
    issuer: string;
    issuedTo: string;
    validFrom: string;
    validTill: string;
    daysToExpiry: number;
    cipherSuite: string;
    tlsVersion: string;
    isRevoked: string;
  }
  
  interface WhoisInfo {
    registrar: string;
    creationDate: string;
    expirationDate: string;
    updatedDate: string;
    nameServers: string[];
    status: string[];
  }
  
  interface SiteData {
    domain: string;
    generalInfo: GeneralInfo;
    securityDetails: SecurityDetails;
    technicalDetails: TechnicalDetails;
    sslStatus: SslStatus;
    whoisInfo: WhoisInfo;
  }
  
// Mock data function - replace with actual data fetching logic for the Chrome extension
const fetchSiteData = async () => ({
  domain: "pecfest.org",
  generalInfo: {
    domainAge: "1.1 year(s)",
    globalRank: "10,00,000+",
    urlRedirects: "No",
    tooLongUrl: "No",
    tooDeepUrl: "No",
  },
  securityDetails: {
    httpStatusCode: 200,
    hstsSupport: "No",
    useOfUrlShortener: "No",
  },
  technicalDetails: {
    ipOfDomain: "34.131.68.236",
    ipAddressPresentInUrl: "No",
  },
  sslStatus: {
    valid: true,
    issuer: "Let's Encrypt",
    issuedTo: "pecfest.org",
    validFrom: "2024-10-15 05:09:52",
    validTill: "2025-01-13 05:09:51",
    daysToExpiry: 68,
    cipherSuite: "TLS_AES_256_GCM_SHA384",
    tlsVersion: "TLSv1.3",
    isRevoked: "No",
  },
  whoisInfo: {
    registrar: "GoDaddy.com, LLC",
    creationDate: "Mon, 18 Sep 2023 13:48:21 GMT",
    expirationDate: "Thu, 18 Sep 2025 13:48:21 GMT",
    updatedDate: "Sat, 02 Nov 2024 13:49:11 GMT",
    nameServers: [
      "ns-cloud-b1.googledomains.com",
      "ns-cloud-b4.googledomains.com",
      "ns-cloud-b2.googledomains.com",
      "ns-cloud-b3.googledomains.com",
    ],
    status: [
      "clientDeleteProhibited",
      "clientRenewProhibited",
      "clientTransferProhibited",
      "clientUpdateProhibited",
    ],
  },
})

const InfoItem: React.FC<InfoItemProps>  = ({ label, value, isGood, tooltip }) => (
  <div className="flex items-center justify-between py-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center">
          <span className="text-xs mr-1">{label}:</span>
          <Info className="w-3 h-3 text-blue-400" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <div className="flex items-center">
      <span className="text-xs mr-1">{value}</span>
      {isGood ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
    </div>
  </div>
)

export default function Popup() {
  const [activeTab, setActiveTab] = useState("overview")
  const [siteData, setSiteData] = useState<SiteData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchSiteData()
      setSiteData(data)
    }
    loadData()
  }, [])

  const calculateScore = (data: SiteData | null) => {
    if (!data) return 0
    let score = 0
    if (data.sslStatus.valid) score += 20
    if (parseFloat(data.generalInfo.domainAge) > 1) score += 15
    if (data.securityDetails.hstsSupport === "Yes") score += 10
    if (data.securityDetails.useOfUrlShortener === "No") score += 10
    if (data.generalInfo.urlRedirects === "No") score += 10
    if (data.generalInfo.tooLongUrl === "No" && data.generalInfo.tooDeepUrl === "No") score += 10
    return Math.min(score, 100)
  }

  const getTrustLabel = (score: number) => {
    if (score >= 80) return "Safe"
    if (score >= 50) return "Caution"
    return "Dangerous"
  }

  const getTrustColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (!siteData) return <div className="text-white p-4">Loading...</div>

  const score = calculateScore(siteData) || 0; // Fallback to 0 if calculateScore returns undefined or null
 // `score` will now be a number

  return (
    <div className="w-[400px] text-white p-4 rounded-lg shadow-lg bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="flex items-center justify-between mb-4 bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
        <div className="flex items-center space-x-2">
          <Globe className="w-6 h-6" />
          <h1 className="text-lg font-bold">{siteData.domain}</h1>
        </div>
        <div className={`w-16 h-2 rounded-full ${getTrustColor(score)}`} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-5 bg-black bg-opacity-30 rounded-lg shadow-md">
          <TabsTrigger 
            value="overview" 
            className="text-xs data-[state=active]:bg-white data-[state=active]:bg-opacity-20 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="general"
            className="text-xs data-[state=active]:bg-white data-[state=active]:bg-opacity-20 data-[state=active]:text-white"
          >
            General
          </TabsTrigger>
          <TabsTrigger 
            value="security"
            className="text-xs data-[state=active]:bg-white data-[state=active]:bg-opacity-20 data-[state=active]:text-white"
          >
            Security
          </TabsTrigger>
          <TabsTrigger 
            value="technical"
            className="text-xs data-[state=active]:bg-white data-[state=active]:bg-opacity-20 data-[state=active]:text-white"
          >
            Technical
          </TabsTrigger>
          <TabsTrigger 
            value="whois"
            className="text-xs data-[state=active]:bg-white data-[state=active]:bg-opacity-20 data-[state=active]:text-white"
          >
            WHOIS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="p-3 rounded-lg bg-black bg-opacity-30 shadow-md">
            <p className="text-sm font-medium mb-2">Trust Score</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`text-3xl font-bold ${getTrustColor(score)} bg-opacity-20 px-2 py-1 rounded`}>
                  {score}
                </span>
                <span className="text-lg">{getTrustLabel(score)}</span>
              </div>
              <div className="w-12 h-12">
                {score >= 80 ? (
                  <Shield className="w-full h-full text-green-500" />
                ) : score >= 50 ? (
                  <AlertTriangle className="w-full h-full text-yellow-500" />
                ) : (
                  <X className="w-full h-full text-red-500" />
                )}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black bg-opacity-30 shadow-md">
            <InfoItem
              label="SSL Status"
              value={siteData.sslStatus.valid ? "Valid" : "Invalid"}
              isGood={siteData.sslStatus.valid}
              tooltip="A valid SSL certificate ensures secure communication."
            />

            <InfoItem
              label="Domain Age"
              value={siteData.generalInfo.domainAge}
              isGood={parseFloat(siteData.generalInfo.domainAge) > 1}
              tooltip="Older domains are generally more trustworthy."
            />

            <InfoItem
              label="HSTS Support"
              value={siteData.securityDetails.hstsSupport}
              isGood={siteData.securityDetails.hstsSupport === "Yes"}
              tooltip="HSTS ensures only secure connections are used."
            />
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between w-full bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
              <span className="font-medium text-sm">General Information</span>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-3 bg-black bg-opacity-30 rounded-lg shadow-md">
              <InfoItem
                label="Domain Age"
                value={siteData.generalInfo.domainAge}
                isGood={parseFloat(siteData.generalInfo.domainAge) > 1}
                tooltip="Older domains are generally more trustworthy."
              />
              <InfoItem
                label="Global Rank"
                value={siteData.generalInfo.globalRank}
                isGood={parseInt(siteData.generalInfo.globalRank.replace(/,/g, '')) < 1000000}
                tooltip="A higher rank suggests better popularity and trustworthiness."
              />
              <InfoItem
                label="URL Redirects"
                value={siteData.generalInfo.urlRedirects}
                isGood={siteData.generalInfo.urlRedirects === "No"}
                tooltip="Redirects may hide the true destination, potentially indicating phishing attempts."
              />
              <InfoItem
                label="Too Long URL"
                value={siteData.generalInfo.tooLongUrl}
                isGood={siteData.generalInfo.tooLongUrl === "No"}
                tooltip="Long URLs can sometimes be used to disguise malicious links."
              />
              <InfoItem
                label="Too Deep URL"
                value={siteData.generalInfo.tooDeepUrl}
                isGood={siteData.generalInfo.tooDeepUrl === "No"}
                tooltip="Overly complex URLs can be a sign of phishing."
              />
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between w-full bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
              <span className="font-medium text-sm">Security Details</span>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-3 bg-black bg-opacity-30 rounded-lg shadow-md">
              <InfoItem
                label="HTTP Status"
                value={siteData.securityDetails.httpStatusCode}
                isGood={siteData.securityDetails.httpStatusCode === 200}
                tooltip="A status of 200 indicates that the site is accessible."
              />
              <InfoItem
                label="HSTS Support"
                value={siteData.securityDetails.hstsSupport}
                isGood={siteData.securityDetails.hstsSupport === "Yes"}
                tooltip="HSTS ensures only secure connections are used."
              />
              <InfoItem
                label="URL Shortener"
                value={siteData.securityDetails.useOfUrlShortener}
                isGood={siteData.securityDetails.useOfUrlShortener === "No"}
                tooltip="Shortened URLs may obscure the true destination and can be risky."
              />
            </CollapsibleContent>
          </Collapsible>

          <Collapsible>
            <CollapsibleTrigger className="flex justify-between w-full bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
              <span className="font-medium text-sm">SSL Certificate Details</span>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-3 bg-black bg-opacity-30 rounded-lg shadow-md">
              <InfoItem
                label="Valid"
                value={siteData.sslStatus.valid ? "Yes" : "No"}
                isGood={siteData.sslStatus.valid}
                tooltip="A valid SSL certificate ensures secure communication."
              />
              <InfoItem
                label="Issuer"
                value={siteData.sslStatus.issuer}
                isGood={true}
                tooltip="The authority that issued the SSL certificate."
              />
              <InfoItem
                label="Days to Expiry"
                value={siteData.sslStatus.daysToExpiry}
                isGood={siteData.sslStatus.daysToExpiry > 30}
                tooltip="Certificates close to expiry may be a risk if not renewed."
              />
              <InfoItem
                label="Revoked"
                value={siteData.sslStatus.isRevoked}
                isGood={siteData.sslStatus.isRevoked === "No"}
                tooltip="A revoked SSL certificate may indicate a security issue."
              />
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between w-full bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
              <span className="font-medium text-sm">Technical Details</span>
              <ChevronDown className="w-4 h-4" />
            
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-3 bg-black bg-opacity-30 rounded-lg shadow-md">
              <InfoItem
                label="IP of Domain"
                value={siteData.technicalDetails.ipOfDomain}
                isGood={true}
                tooltip="The IP address associated with the domain, used for network routing."
              />
              <InfoItem
                label="IP in URL"
                value={siteData.technicalDetails.ipAddressPresentInUrl}
                isGood={siteData.technicalDetails.ipAddressPresentInUrl === "No"}
                tooltip="Using an IP address instead of a domain can be a phishing tactic."
              />
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>

        <TabsContent value="whois" className="space-y-4">
          <Collapsible>
            <CollapsibleTrigger className="flex justify-between w-full bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
              <span className="font-medium text-sm">WHOIS Information</span>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 p-3 bg-black bg-opacity-30 rounded-lg shadow-md">
              <InfoItem
                label="Registrar"
                value={siteData.whoisInfo.registrar}
                isGood={true}
                tooltip="The company that registered the domain name."
              />
              <InfoItem
                label="Creation Date"
                value={new Date(siteData.whoisInfo.creationDate).toLocaleDateString()}
                isGood={true}
                tooltip="When the domain was first registered."
              />
              <InfoItem
                label="Expiration Date"
                value={new Date(siteData.whoisInfo.expirationDate).toLocaleDateString()}
                isGood={new Date(siteData.whoisInfo.expirationDate) > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                tooltip="When the domain registration will expire. Should be well in the future."
              />
              <p className="text-xs mt-2 font-medium">Name Servers:</p>
              <ul className="list-disc list-inside pl-2">
                {siteData.whoisInfo.nameServers.map((server, index) => (
                  <li key={index} className="text-xs py-1">{server}</li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center mt-4 bg-black bg-opacity-30 p-3 rounded-lg shadow-md">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-white hover:text-white hover:bg-white hover:bg-opacity-10"
          onClick={() => setActiveTab("overview")}
        >
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </Button>
        <Button 
          variant="link" 
          size="sm" 
          className="text-xs text-white hover:text-gray-300"
        >
          View Full Report
        </Button>
      </div>
    </div>
  )
}