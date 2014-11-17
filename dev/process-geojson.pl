#!/usr/bin/perl -w
use strict;
use JSON;

@ARGV = ('November_4_2014_General_Election_Unofficial_Results.csv') if not @ARGV;
$_ = <>;
chomp;
my @v;
my %ward;
my @columns = map { chomp; s/["\r\n]//g; lc } split /,/;
while (<>) {
    s/\s+$//;
    s/^"//; s/"$//;
    my %r;
    @r{@columns} = split /","/;
    next if $r{candidate} =~ /ER VOTES$/ or $r{contest_name} =~ /^ADVISORY NEIGHBORHOOD| TOTAL$/;
    my $key0 = $r{contest_name};
    $key0 =~ s/ - /-/;
    $key0 =~ s/(\w+)/\u\L$1/g;
    $key0 =~ s/(?<= )(Of|The)(?= )/\L$1/g;
    $key0 =~ s/(?: of the)? District of Columbia//;
    $key0 =~ s/One/1/;
    $key0 =~ s/Three/3/;
    $key0 =~ s/Five/5/;
    $key0 =~ s/Six/6/;
    my $key1 = $r{candidate};
    $key1 =~ s/ INITIATIVE 71//;
    $key1 =~ s/.* //;
    $key1 =~ s/(\w+)/\u\L$1/g;
    $key1 = '[Write-in]' if $key1 eq 'Write-In';
    $key1 =~ s/^Labeaume/LaBeaume/;
    my $key2 = $r{precinct_number} + 0;
    if ($ward{$r{precinct_number}} && $ward{$r{precinct_number}} != $r{ward}) {
        warn "Precinct $r{precinct_number} is Ward $ward{$r{precinct_number}}" .
            " and $r{ward}\n";
    }
    $ward{$r{precinct_number}} = $r{ward} + 0;
    $v[$key2]{$key0}{$key1} = $r{votes} + 0;
}
print to_json(\@v, {canonical => 1});

@ARGV = ('dc-precincts-2012.json');
$/ = undef;
$_ = <>;
my $data = decode_json($_);
for my $f (@{$data->{features}}) {
    my $pct = $f->{properties}{Description} =~ /Precinct (\d+)/ ? $1 : 0;
    $f->{id} = $pct + 0;
    $f->{properties} = {ward => $ward{$pct}};
    $f->{geometry} = $f->{geometry}{geometries}[1];
}
#print to_json($data, {canonical => 1});
warn scalar(@{$data->{features}}), " precincts\n";
